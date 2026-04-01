import OpenAI from 'openai'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { makeDirectory } from 'make-dir'
import { arch, cpus, platform } from 'os'
import { Timer } from 'three'
// import z from 'zod'

// const TodoList = z.array(
//   z.discriminatedUnion('status', [
//     z
//       //
//       .object({
//         status: z.literal('pending'),
//         task: z.string().describe('task description')
//       })
//       .describe('pending task'),
//     z
//       //
//       .object({
//         status: z.literal('completed'),
//         task: z.string().describe('task description')
//       })
//       .describe('completed task'),
//     z
//       //
//       .object({
//         status: z.literal('in-progress'),
//         task: z.string().describe('task description')
//       })
//       .describe('in-progress task')
//   ])
// )

export async function writePlan({ workspace, inbound, checkAborted, onEvent }) {
  const controller = new AbortController()
  const signal = controller.signal

  const tt = setInterval(() => {
    if (checkAborted()) {
      clearInterval(tt)
      controller.abort()
      return
    }
  })

  const openai = new OpenAI({
    baseURL: inbound.baseURL,
    apiKey: inbound.apiKey
  })

  await makeDirectory(join(workspace, 'ai-memory'))
  await makeDirectory(join(workspace, 'code'))

  let whichPlan = ''
  try {
    const oldPlan = await readFile(join(workspace, 'ai-memory', 'system-plan.md'), 'utf8').catch(
      () => {
        throw new Error('no old plan found')
      }
    )
    const appIdea = await readFile(join(workspace, 'ai-memory', 'app-idea.md'), 'utf8').catch(
      () => {
        throw new Error('no app idea found')
      }
    )

    if (appIdea === inbound.appUserPrompt.trim()) {
      whichPlan = oldPlan
    } else {
      throw new Error('idea updated')
    }
  } catch (e) {
    //
    console.log(e.message)

    /*

## if needed, guideline for "browser":
- if we need to use browser automation: we use "playwrite" npm package, config is: {"headless": "false"}, "page.goto(url, { waitUntil: 'load' });", if we take screenshots we put it into "./public/screenshots/[id].png", if we need to save text data we put it into "json database"
- always use {"fullPage": true} screenshot: await page.screenshot({ path: "./screenshot/[...].png", fullPage: true });

## if needed, guideline for "AI, LLM":
- if we need to connect to LLM: we use "lmstudio". the default baseURL is: "http://localhost:1234/v1", the default model is: "qwen/qwen3.5-4b", the default API KEY is "NULL"
- we use "openai" npm package with lmstudio

## if needed, guideline for "generating text embedding":
- if we need to use using LLM to make text embedding vector output: we use "openai" npm package with lmstudio baseURL and apikey if needed
- the default text embedding model is: "qwen.qwen3-vl-embedding-2b"

## if needed, guideline for "database":
- if we need to use local json file based database, put json files into a "./databases/[db].json" folder

## if needed, guideline for "upload":
- if we need to handle upload files, we use "./public/uploads" folder

## if needed, guideline for "dotenv"
- if we need to use dotenv , use this: "import { config } from 'dotenv';"

    */

    const plan = await openai.chat.completions
      .create(
        {
          model: inbound.model,
          messages: [
            {
              role: 'system',
              content: `
# Role:
You are a senior software engineer, you write a "System prompt" for other AI Coding Agent to write code to achieve the goal set by the user.
You write the plan high level enough so that you don't implement the code. 

# Execution Plan & Know How Document:
- Current OS: ${platform()}
- Current Arch: ${arch()}
- CPU Cores: ${cpus()
                .map((r, i) => `[cpu core:${i + 1}] ${r.model}`)
                .join(', ')}

- MUST NOT implement code
- MUST ONLY plan code

- list out all folder and files in the project file tree
  -- Must follow folder structure so that code files are not duplicated or misplaces.
- for each file, write 
  -- a overall summary and purpose
  -- name and purpose of a exported function / class / const / etc

- tell ai agent coder to MUST use bun runtime for js, ts
- tell ai agent coder to MUST use nodejs mode for typescript
- tell ai agent coder to MUST use relative path where it's suitable
- tell ai agent coder to MUST use temp folder where it's testing code 
- tell ai agent coder to MUST have log files
- tell ai agent coder to MUST look at log files to make sure the code is operating as planned, when they encounter bugs. 
- tell ai agent coder to Must use named export and named import for all modules
- list out package dependencies (Recommend others to use existing library from "nodejs npm" or "bun") **MUST install only 1 package at a time**
- MUST include "Goal Verification Checklist" for the user goal
- MUST run what you built at the end to make sure it works

- if we need to configure tsconfig.json for cli bun typescript then use the following: 
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "node20",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "logs", "temp", "output"]
}
\`\`\`

- tell ai agent coder to if we need to develop bun cli scripts, we need to install "@types/node" in package.json:
- tell ai agent coder to Must always use bun to insatll packages instead of npm
- tell ai agent coder to always treat the default current working directory as workspace or project folder
- tell ai agent coder to never use emoji
- tell ai agent coder to write an AI Agent Skill file called: "skill.md", so that other agent knows how to use this tool box that we're planning
`
            },
            {
              role: 'user',
              content: `User Goal: 
${inbound.appUserPrompt}
              `
            }
          ],

          stream: true,
          stream_options: {
            include_usage: true
          },
          reasoning_effort: 'xhigh',
          temperature: 0.0
          // response_format: {
          //   type: 'json_schema',
          //   json_schema: {
          //     name: 'output',
          //     schema: FinalOutput.toJSONSchema()
          //   }
          // }
        },
        { signal }
      )
      .then(async (response) => {
        let plan = ''
        let thinking = ''
        let clock = new Timer()
        let counter = 0
        for await (let event of response) {
          try {
            counter++
            clock.update(performance.now())

            let delta = event?.choices[0]?.delta as any
            thinking += delta.reasoning_content || ''
            plan += delta.content || ''

            let tps = counter / clock.getElapsed()
            console.log('tps', tps)

            onEvent({ type: 'thinking', thinking: `${thinking}` })
            onEvent({ type: 'stream', stream: `${plan}` })
          } catch (e) {
            // console.log(e)
          }
        }

        onEvent({ type: 'thinking', thinking: plan })
        onEvent({ type: 'stream', stream: plan })

        console.log(plan)

        return plan
      })
      .catch((r) => {
        console.error(r)
        return null
      })

    onEvent({
      type: 'plan',
      plan: plan
    })

    whichPlan = plan

    try {
      await writeFile(
        join(workspace, 'ai-memory', 'app-idea.md'),
        inbound.appUserPrompt.trim(),
        'utf8'
      )
      await writeFile(join(workspace, 'ai-memory', 'system-plan.md'), whichPlan, 'utf8')
    } catch (e) {
      console.error('cannot write plan file')
    }

    if (signal.aborted) {
      throw new Error('request is aborted')
    }
    if (checkAborted()) {
      throw new Error('request is aborted')
    }
  }

  clearInterval(tt)
  return { plan: whichPlan }
}

//

function removeThinkTags(input) {
  // The 'g' flag is for global, the 's' flag is for dotAll (allows '.' to match newlines)
  const regex = /<think>[\s\S]*?<\/think>/gs
  const result = input.replace(regex, '')
  return result
}
