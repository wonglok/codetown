import { app } from 'electron'
import { makeDirectory } from 'make-dir'
// import z from 'zod'
// import { developCode } from './subagents/developCode'
import { writePlan } from './subagents/writePlan'
import { runAgent } from './runAgent'
// import { initProject } from './subagents/initProject'
// import { readFile, writeFile } from 'fs/promises'
// import { join } from 'path'

export const runAppPlanner = async ({ done, checkAborted, onEvent, inbound, randID }) => {
  const docs = app.getPath('documents')
  const workspace = `${docs}/ai-home/apps/${inbound.appName}`
  await makeDirectory(workspace)

  const [{ plan }] = await Promise.all([
    //
    writePlan({
      //
      workspace: workspace,
      inbound,
      checkAborted,
      onEvent: onEvent
    })
    //
    // initProject({
    //   //
    //   workspace,
    //   onEvent
    // })
  ])

  // await makeDirectory(`${workspace}/frontend`)
  // await makeDirectory(`${workspace}/backend`)

  const runner = async ({}) => {
    // let res = await developCode({
    //   randID: randID,
    //   checkAborted: checkAborted,
    //   workspace: workspace,
    //   plan: plan,
    //   inbound: inbound,
    //   onEvent: onEvent
    // })

    await runAgent({
      plan: plan,
      checkAborted,
      onEvent,
      inbound,
      randID,
      done
    })
      .catch((r) => {
        console.error(r)
      })
      .finally(() => {
        onEvent({ type: 'alldone', alldone: 'Goal Achieved' })
        done()
      })

    //

    //
    // return await runner({
    //   //
    // })
  }

  // const sessionItems = await readFile(join(workspace, 'session.json'), 'utf8')
  //   .then((STR) => {
  //     return JSON.parse(STR)
  //   })
  //   .catch((err) => {
  //     console.error(err)
  //     return []
  //   })

  await runner({})

  //
}

// export const CoderSchema = z
//   .object({
//     _id: z.string().describe('small-id-for-unique-object-id'),
//     filePath: z.string().describe('file location path'),
//     thought: z.string().describe(`thouht of the agent for that task`),
//     systemPrompt: z
//       .string()
//       .describe(
//         'AI agent context: system prompt message for the task and the code to be written. you need to follow the system prompt for this.'
//       ),

//     userPrompt: z
//       .string()
//       .describe(
//         'AI agent context: user prompt message for the task and the code file to be written and with file content summary'
//       )
//   })
//   .describe('a development plan for AI Coding Agent to generate that code file')

// export type CoderType = z.infer<typeof CoderSchema>

// export const ParallelDevelopmentPlanSchema = z.object({
//   folders: z.string().describe('folder structure'),
//   todo: z.array(
//     z.object({
//       //
//       task: z.string().describe('task'),
//       codes: z.array(CoderSchema)
//       //
//     })
//   )
//   // tasks: z.discriminatedUnion('type', [webapp, commandLineTool]),
// })

// export type ParallelDevelopmentPlanSchemaType = z.infer<typeof ParallelDevelopmentPlanSchema>
