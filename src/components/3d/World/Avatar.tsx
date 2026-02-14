import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useAnimationStore } from 'bvhecctrl'

export default function Avatar(props: any) {
  const slowMotion = props.slowMotion ?? 1
  // Reference to previous action name
  const prevActionNameRef = useRef('Idle_Loop')
  // State to control if next action can be played
  const [canPlayNext, setCanPlayNext] = useState(true)

  // Load the GLTF model and animations
  const { nodes, materials, animations }: any = useGLTF('/avatar/AnimationLibrary.glb')
  const { ref, actions, mixer }: any = useAnimations(animations)
  const actionStore = useAnimationStore((state) => state.animationStatus)

  console.log('actionStore', actionStore)

  // Modify materials
  // materials.M_Joints.side = THREE.FrontSide
  // materials.M_Joints.color = new THREE.Color('#000000') // 0x00ffff, 0xAA0000
  // materials.M_Main.side = THREE.FrontSide
  // materials.M_Main.color = new THREE.Color('#818181') // 0xDEDEDE, 0x666666

  // Mapping store status to animation names in `actions`
  const statusToActionMap = {
    IDLE: 'Idle_Loop',
    WALK: 'Walk_Loop', // Sprint_Loop, Walk_Loop, Jog_Fwd_Loop
    RUN: 'Jog_Fwd_Loop', // Jog_Fwd_Loop
    JUMP_START: 'Jump_Start',
    JUMP_IDLE: 'Jump_Loop',
    JUMP_FALL: 'Jump_Loop',
    JUMP_LAND: 'Jump_Land',
  }

  useEffect(() => {
    // Prepare next action based on current store status
    const nextActionName = statusToActionMap[actionStore]
    const nextAction = actions[nextActionName]
    // If no next action, exit early
    if (!nextAction) return

    // Sotre the previous action name
    const prevActionName = prevActionNameRef.current

    // Only cross fade if switching to a new animation clip
    if (nextActionName !== prevActionName && canPlayNext) {
      // Special setup for one-time animations (jump start, jump land, etc.)
      if (nextActionName === statusToActionMap.JUMP_START || nextActionName === statusToActionMap.JUMP_LAND) {
        // Set canPlayNext to false to prevent immediate re-triggering
        setCanPlayNext(false)
        nextAction.timeScale = 1.6
        nextAction.reset().crossFadeFrom(actions[prevActionName], 0.1).setLoop(THREE.LoopOnce, 1).play()
        nextAction.clampWhenFinished = true
      } else {
        // For all other animations, allow immediate re-triggering
        setCanPlayNext(true)
        nextAction.timeScale = 1
        nextAction.reset().crossFadeFrom(actions[prevActionName], 0.2).play()
      }

      // Update the previous action name reference
      prevActionNameRef.current = nextActionName
    }

    /**
     * For one-time animations, we set special conditions to allow next action to be played
     */
    // If jump start is not finished, and actionStore is not jump start or jump idle, allow next action
    // if actionStore is jump start or jump idle, continue to wait for jump start to finish
    if (
      !canPlayNext &&
      prevActionName === statusToActionMap.JUMP_START &&
      actionStore !== 'JUMP_IDLE' &&
      actionStore !== 'JUMP_START'
    ) {
      setCanPlayNext(true)
    }

    // If jump land is not finished, and actionStore is not idle or jump land, allow next action
    // if actionStore is idle or jump land, continue to wait for jump land to finish
    if (
      !canPlayNext &&
      prevActionName === statusToActionMap.JUMP_LAND &&
      actionStore !== 'IDLE' &&
      actionStore !== 'JUMP_LAND'
    ) {
      setCanPlayNext(true)
    }
  }, [actionStore, canPlayNext])

  // Add event listener for animation finish
  useEffect(() => {
    // Reset canPlayNext when jump start or jump land finishes
    const onFinished = (e: any) => {
      if (
        !canPlayNext &&
        (e.action._clip.name === statusToActionMap.JUMP_START || e.action._clip.name === statusToActionMap.JUMP_LAND)
      ) {
        setCanPlayNext(true)
      }
    }

    // Add event listener to the mixer
    mixer.addEventListener('finished', onFinished)
    // Cleanup function to remove the event listener
    return () => {
      mixer.removeEventListener('finished', onFinished)
    }
  }, [canPlayNext])

  // Add slowmotion & pause feature to animations
  useEffect(() => {
    mixer.timeScale = props.paused ? 0 : slowMotion
  }, [props.paused, slowMotion])

  return (
    <group ref={ref} dispose={null} position={[0, -1.1, 0]}>
      <group name='Mannequin'>
        <skinnedMesh
          name='Mannequin_1'
          geometry={nodes.Mannequin_1.geometry}
          material={materials.M_Main}
          skeleton={nodes.Mannequin_1.skeleton}
          castShadow
          receiveShadow
        />
        <skinnedMesh
          name='Mannequin_2'
          geometry={nodes.Mannequin_2.geometry}
          material={materials.M_Joints}
          skeleton={nodes.Mannequin_2.skeleton}
          castShadow
          receiveShadow
        />
      </group>
      <primitive object={nodes.root} />
    </group>
  )
}

//

useGLTF.preload('/avatar/AnimationLibrary.glb')

//
