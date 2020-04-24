/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useState, useCallback, forwardRef, Suspense } from 'react'
import { useLoader, useFrame, useResource } from 'react-three-fiber'
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useSphere, useParticle, useLockConstraint, useConeTwistConstraint } from 'use-cannon';
import { useSpring, a, config } from 'react-spring/three';
import * as THREE from "three";
import lerp from "lerp"

import useSound from 'use-sound'

import HitSfx from './sounds/Player_Hit.wav'
import HitSfx2 from './sounds/Player_Hit_2.wav'
import alertSfx from './sounds/Alert.wav'

import { COLLISION_GROUP, bodyApi, useOutline, useCorona, usePlayerAttack } from "./store"
import { getRandomUnity } from './utility/math';
import Exclamation from './Exclamation';
import Pow from './Pow';

const ATTACK_DURATION = 10
const Y_BIAS = .6

const PhyCorona = forwardRef(

  function PhyCorona(props, bodyRef) {
    const { id, position, isDead, isAttacking, isSeeking } = props
  
    const [isUnderAttack, setIsUnderAttack] = useState(false)
  
    const time = useRef(0)
    const velocity = useRef()
    const attackPosition = useRef()
    const orientation = useRef()
    const onCollide = useRef()
    const raycast = useRef(new THREE.Raycaster())
  
    const {
      removeCorona,
      decreaseLife,
      setAttacking,
      resetAttacking,
      setSeeking,
      resetSeeking,
    } = useCorona(s => s)
  
    const isPlayerAttacking = usePlayerAttack(s => s.isAttacking)
  
    const rand = React.useRef(Math.floor(Math.random() * 10) + 1)
  
    const [playHitSfx, hitSfxMeta] = useSound(rand.current > 5 ? HitSfx : HitSfx2)
    const [playAlertSfx] = useSound(alertSfx)
  
    const [coronaBody, coronaBodyApi] = useSphere(() => ({
      args: 0.2,
      mass: 0.2,
      position: [position[0], position[1] + Y_BIAS, position[2]],
      collisionFilter: COLLISION_GROUP.CORONA,
      collisionFilterMask: COLLISION_GROUP.CHEST | COLLISION_GROUP.BAT | COLLISION_GROUP.CORONA | COLLISION_GROUP.TILES,
      onCollide: e => onCollide.current(e)
    }))
  
    const [lock, lockApi] = useParticle(() => ({
      args: [0.05, 0.2, 0.5, 16],
      position: [position[0], position[1] + Y_BIAS, position[2]],
      material: { friction: 0, restitution: 0.2 },
      linearDamping: 0.1,
      angularDamping: 0.1,
      type: "Kinetic"
    }))
  
    const [, , { disable }] = useLockConstraint(coronaBody, lock)
  
    const handleCollide = useCallback(
      function handleCollide(e) {
  
        const { contact, body } = e
        const { impactVelocity, ni } = contact
  
        coronaBodyApi.rotation.set(
          coronaBody.current.rotation.x + ni[0],
          coronaBody.current.rotation.y + ni[1],
          coronaBody.current.rotation.z + ni[2]
        )
  
        if (isPlayerAttacking && body?.userData?.type === COLLISION_GROUP.BAT) {
  
          const absVelocity = Math.abs(impactVelocity)
          playHitSfx()
          decreaseLife(id, absVelocity)
          setIsUnderAttack(s => { if (!s) return true })
        }
  
      },
      [id, coronaBody, coronaBodyApi, isPlayerAttacking, disable, decreaseLife]
    )
  
    const updateOrientation = useCallback(
      function updateOrientation() {
        velocity.current = new THREE.Vector2(getRandomUnity(), getRandomUnity()).normalize()
        orientation.current = new THREE.Vector3(velocity.current.x, 0, velocity.current.y).normalize()
      },
      [velocity, orientation]
    )
  
    const getIntersects = useCallback(
      function getIntersects(position, orientation, scene, collisionArray) {
  
        raycast.current.set(position, orientation)
        const intersects = raycast.current.intersectObjects(scene.children);
  
        return intersects.filter(({ object }) => collisionArray.includes(object?.userData?.type))
      }, [raycast])
  
    const updatePosition = useCallback(
      function updatePosition(scene) {
        const bodies = getIntersects(coronaBody.current.position, orientation.current, scene, [COLLISION_GROUP.BODY, COLLISION_GROUP.CORONA])
        const tiles = getIntersects(
          new THREE.Vector3(
            coronaBody.current.position.x + velocity.current.x / 25,
            coronaBody.current.position.y,
            coronaBody.current.position.z + velocity.current.y / 25
          ),
          new THREE.Vector3(0, -1, 0),
          scene,
          [COLLISION_GROUP.TILES]
        )
  
        if (bodies?.[0]?.distance < 0.5 || tiles?.length === 0) {
          updateOrientation()
        } else {
          lockApi.position.set(lock.current.position.x + velocity.current.x / 50, position[1] + Y_BIAS, lock.current.position.z + velocity.current.y / 50)
        }
      },
      [raycast, coronaBody, orientation, lockApi, updateOrientation, velocity]
    )
  
    const seekBody = useCallback(
      function seekBody() {
        const dir = new THREE.Vector3()
        dir.subVectors(bodyRef.current.position, coronaBody.current.position).normalize();
  
        lockApi.position.set(lock.current.position.x + dir.x / 40, position[1] + Y_BIAS, lock.current.position.z + dir.z / 40)
      },
      [bodyRef, coronaBody, lockApi]
    )
    
    const checkProximityToBody = useCallback(
      function checkProximityToBody(p) {
        if (isDead) return
  
        const [x, y, z] = p
        const line = new THREE.Line3(new THREE.Vector3(x, y, z), coronaBody.current.position)
        const distance = line.distance()
  
        if (distance < 1) {
          if (isSeeking) {
            resetSeeking(id)
          }
          if (!isAttacking) {
            setAttacking(id)
            attackPosition.current = [bodyRef.current.position.clone(), coronaBody.current.position.clone()]
            time.current = 0
          }
  
        } else if (distance >= 1 && distance < 4) {
  
          if (isAttacking) {
            resetAttacking(id)
          }
          if (!isSeeking) {
            setSeeking(id)
          }
        } else {
          if (isSeeking) {
            resetSeeking(id)
          }
          if (isAttacking) {
            resetAttacking(id)
          }
        }
      },
      [id, raycast, isSeeking, setSeeking, resetSeeking, setAttacking, resetAttacking, isAttacking, isDead]
    )
  
    const handleAttack = useCallback(
      function handleAttack() {
        if (!attackPosition.current) return
  
        if (time.current < ATTACK_DURATION * 2) {
  
          const { x, y, z } = attackPosition.current[time.current < ATTACK_DURATION ? 0 : 1]
          lockApi.position.set(
            lerp(lock.current.position.x, x, 0.2),
            lerp(lock.current.position.y, y, 0.2),
            lerp(lock.current.position.z, z, 0.2)
          )
  
        }
        if (time.current === ATTACK_DURATION * 4) {
          resetAttacking(id)
        }
  
        time.current += 1
      },
      [time, resetAttacking, id]
    )
  
    useEffect(() => void (onCollide.current = handleCollide), [onCollide, handleCollide])
    useEffect(() => void (isSeeking && playAlertSfx()), [isSeeking, playAlertSfx])
    useEffect(() => void updateOrientation(), [updateOrientation])
    useEffect(() => void (isUnderAttack && setTimeout(() => setIsUnderAttack(false), 300)), [isUnderAttack, setIsUnderAttack])
    useEffect(() => bodyApi.current.position.subscribe(checkProximityToBody), [bodyApi, checkProximityToBody])
  
    useEffect(() => {
      if (isDead) {
        disable()
  
        const dir = new THREE.Vector3()
        dir.subVectors(bodyRef.current.position, coronaBody.current.position).normalize();
        coronaBodyApi.applyLocalImpulse([-3 * dir.x, -3, -3 * dir.z], [1, 1, 1])
      }
    }, [isDead, bodyRef, coronaBody, coronaBodyApi])
  
    
    useFrame(({ scene }) => {
      if (!isDead) {
  
        if (isAttacking) {
          handleAttack()
        } else if (isSeeking) {
          seekBody()
        } else {
          updatePosition(scene)
        }
      }
    })
  
    return (
      <>
        <mesh ref={lock} />
        <mesh ref={coronaBody} userData={{ type: COLLISION_GROUP.CORONA, id }} />
        <Suspense fallback={null}>
          <Corona ref={coronaBody} removeCorona={removeCorona} isUnderAttack={isUnderAttack} {...props} />
        </Suspense>
      </>
    )
  }
)

const Corona = forwardRef((props, ref) => {
  const { id, isDead, isAttacking, isSeeking, isUnderAttack, removeCorona } = props
  
  const group = useRef()
  const rotationGroup = useRef()
  const rand = React.useRef(Math.floor(Math.random() * 10) + 1)

  const { addOutline, removeOutline } = useOutline(s => s)

  const { nodes } = useLoader(GLTFLoader, '/corona.glb',
    loader => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco-gltf/");
      loader.setDRACOLoader(dracoLoader);
    }
  )

  const [springProps, set] = useSpring(() => ({ opacity: 1, config: config.molasses }))

  const [resourceRef, material] = useResource()

  useEffect(() => void addOutline(group.current), [addOutline, group]);
  useEffect(() => {
    if (isDead) {
      removeOutline(group.current)
      set({ opacity: 0, config: config.molasses, onRest: () => removeCorona(id) })
    }
  }, [isDead])

  useFrame(({ clock }) => {
    group.current.position.copy(ref.current.position)
    rotationGroup.current.rotation.copy(ref.current.rotation)

    const multiplier = 10 * (isSeeking ? 2 : 1)

    group.current.position.y += 0.1 * (Math.sin((clock.getElapsedTime() % (2 * Math.PI)) * multiplier + rand.current * 5))
  })

  return (
    <>
      <a.meshToonMaterial
        transparent
        color={isDead ? 0xff0000 : 0x1E9983}
        shininess={0.3}
        specular={0xaaaaaa}
        ref={resourceRef}
        {...springProps}
      />

      <group ref={group} dispose={null} scale={[0.1, 0.1, 0.1]} >
        <Suspense fallback={null}>
          <Exclamation position={[0, 2.5, 0]} scale={[2, 2, 1]} visible={(isSeeking && !isAttacking)} />
          <Pow position={[0, 1.5, 0]} scale={[2, 2, 1]} visible={isUnderAttack && !isSeeking} />
        </Suspense>
        <group ref={rotationGroup} >
          <mesh castShadow material={material} geometry={nodes.Cube_0.geometry} name="Cube_0" />
          <mesh castShadow material={material} geometry={nodes.Cube_1.geometry} name="Cube_1" />
          <mesh castShadow material={material} geometry={nodes.Cube_2.geometry} name="Cube_2" />
          <mesh castShadow material={material} geometry={nodes.Cube_3.geometry} name="Cube_3" />
        </group>
      </group>
    </>
  )
})

export default PhyCorona