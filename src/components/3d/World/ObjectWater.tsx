import { useFrame } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { PlaneGeometry, RepeatWrapping, TextureLoader, Vector3 } from 'three'
import { WaterMesh } from 'three/examples/jsm/objects/WaterMesh.js'

// waternormals
export function ObjectWater() {
  //
  const [api, setAPI] = useState<any>({})

  useEffect(() => {
    const geo = new PlaneGeometry(1000, 1000)
    geo.rotateX(Math.PI * -0.5)
    const water = new WaterMesh(geo, {
      resolutionScale: 0.5,
      sunDirection: new Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 5,
      waterNormals: new TextureLoader().load(`/textures/waternormals.jpg`, (tex) => {
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping
      }),
    })

    water.position.y = -9.6
    water.rotation.x = Math.PI * 0

    setAPI({
      func: () => {},
      display: <primitive object={water}></primitive>,
    })
  }, [])

  useFrame(() => {
    if (api?.func) {
      api?.func()
    }
  })

  return (
    <>
      {api.display}
      {/*  */}
      {/*  */}
    </>
  )
}
