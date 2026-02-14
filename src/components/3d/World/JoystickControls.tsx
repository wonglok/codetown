'use client'

import { Suspense, useEffect, useState } from 'react'

import { Joystick, VirtualButton } from 'bvhecctrl'

export const JoystickControls = () => {
  const [isTouchScreen, setIsTouchScreen] = useState(false)
  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchScreen(true)
    } else {
      setIsTouchScreen(false)
    }
  }, [])
  return (
    <>
      {isTouchScreen && (
        <>
          <Joystick />
          <VirtualButton id='run' label='RUN' buttonWrapperStyle={{ right: '100px', bottom: '40px' }} />
          <VirtualButton id='jump' label='JUMP' buttonWrapperStyle={{ right: '40px', bottom: '100px' }} />
        </>
      )}
      {!isTouchScreen && (
        <>
          <div
            className=' select-none hidden lg:flex absolute bottom-10  items-center justify-center'
            style={{ width: `20%`, left: `calc(calc(50% - 20% / 2))` }}
          >
            <img className='w-full select-none' src={`/textures/instruction.png`}></img>
          </div>
        </>
      )}
    </>
  )
}
