import { app } from 'electron'
import { makeDirectory } from 'make-dir'
import { OneStep, writeCode } from './subagents/writeCode'
import { writeFile } from 'fs/promises'
import path from 'path'
import { readFile } from 'fs/promises'

const FailCounter = {}
export const runAgent = async ({ done, plan, checkAborted, onEvent, inbound, randID }) => {
  FailCounter[randID] = FailCounter[randID] || 0

  const docs = app.getPath('documents')
  const workspace = `${docs}/ai-home/apps/${inbound.appName}`
  await makeDirectory(workspace)

  if (checkAborted()) {
    return
  }

  const loopRun = async ({ memory, step }: { memory: any[]; step: OneStep }) => {
    if (FailCounter[randID] >= 50) {
      onEvent({ type: 'error', error: 'Failed too many times.' })
      return
    }
    if (checkAborted()) {
      return
    }

    const nextStep: OneStep | null = await writeCode({
      plan: plan,
      step: step,
      checkAborted: checkAborted,
      workspace: `${workspace}`,
      inbound: inbound,
      memory: memory,
      onEvent: (ev) => {
        onEvent(ev)
      }
    })

    if (FailCounter[randID] >= 50) {
      onEvent({ type: 'error', error: 'Failed too many times.' })
      return
    }

    if (!nextStep) {
      FailCounter[randID] = FailCounter[randID] + 1
      return await loopRun({ step: step, memory })
    }

    await writeFile(
      path.join(workspace, 'ai-memory', 'state.json'),
      JSON.stringify(
        {
          step: nextStep,
          memory: memory
        },
        null,
        '\t'
      )
    )

    if (nextStep?.stop?.length > 0) {
      onEvent({
        type: 'done',
        done: `User written goal achieved\n\n${nextStep.stop.map((r) => r.content).join('\n')}`
      })

      return
    }

    return await loopRun({
      step: nextStep,
      memory: memory
    })
  }

  let state = {
    memory: [],
    step: {
      nextSteps: [],
      codes: [],
      logs: [],
      commands: [],
      commandResults: [],
      stop: [],
      nextCheckup: []
      // nextContextPrompt: []
    } satisfies OneStep
  }

  try {
    let stateStr = await readFile(path.join(workspace, 'ai-memory', 'state.json'), 'utf-8')
    state = JSON.parse(stateStr)
  } catch (e) {
    // console.error(e)
  }

  await loopRun({
    step: state.step,
    memory: state.memory
  })
}
