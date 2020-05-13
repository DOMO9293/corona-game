/*
auto-generated by: https://github.com/react-spring/gltfjsx
*/

import React, { useRef, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useFrame, useResource } from 'react-three-fiber'
import { useSphere, useParticle, useLockConstraint } from 'use-cannon';
import { useSpring, a, config } from 'react-spring/three';
import * as THREE from "three";
import useSound from 'use-sound'
import { useService } from "@xstate/react";

import HitSfx from './sounds/Player_Hit.wav'
import HitSfx2 from './sounds/Player_Hit_2.wav'
import alertSfx from './sounds/Alert.wav'
import { useOutline, useAssets, usePlayer } from "./store"
import Exclamation from './Exclamation';
import Pow from './Pow';
import { easeInQuad, easeInElastic } from "./utility/easing"
import { COLLISION_GROUP, CORONA } from './config';

const { ATTACK_DURATION, IDLE_VELOCITY, SEEK_VELOCITY } = CORONA

const PhyCorona = React.memo(function PhyCorona(props) {
  const { interpreter } = props

  const attackPosition = useRef()
  const renderingGroup = useRef()
  const additiveOrientation = useRef({ coords: [0, 0, 0], time: 0.5 })

  // XSTATE
  const [state, send] = useService(interpreter)
  const { context } = state
  const {
    id,
    isUnderAttack,
    seekAlert,
    phyRef,
    orientation,
    initPosition,
  } = context

  const {
    isIdle,
    isSeeking,
    isPreattacking,
    isAttacking,
    isSpawning,
    isDead,
  } = useMemo(() => ({
    isIdle: state?.matches("live.idle"),
    isSeeking: state?.matches("live.seeking"),
    isPreattacking: state?.matches("live.preattacking"),
    isAttacking: state?.matches("live.attacking"),
    isSpawning: state?.matches("live.spawning"),
    isDead: state?.matches("dead"),
  }), [state])

  // ZUSTAND
  const playerBody = usePlayer(s => s.playerBody)

  // CANNON INIT
  const [coronaBody, coronaBodyApi] = useSphere(() => ({
    args: 0.3,
    mass: 0.1,
    position: initPosition,
    collisionFilter: COLLISION_GROUP.CORONA,
    collisionFilterMask: COLLISION_GROUP.CHEST | COLLISION_GROUP.BAT | COLLISION_GROUP.CORONA | COLLISION_GROUP.TILES,
    onCollide: e => onCollide.current(e)
  }))

  const [lock, lockApi] = useParticle(() => ({ position: initPosition }), phyRef)

  const [, , { disable }] = useLockConstraint(coronaBody, lock)

  // HANDLE CORONA BODY ON COLLIDE 
  const onCollide = useRef()
  const handleCollide = useCallback(
    function handleCollide(e) {

      const { body, contact } = e
      
      if (body?.userData?.type === COLLISION_GROUP.CORONA) {
        const { rj } = contact
        additiveOrientation.current = { coords: rj, time: 0.5 }
      }

      if (body?.userData?.type === COLLISION_GROUP.BAT && body?.userData?.isAttacking) {
        send("ATTACKED")
      }

    },
    [send, additiveOrientation]
  )
  useEffect(() => void (onCollide.current = handleCollide), [onCollide, handleCollide])

  // HANDLE CORONA DEAD STATE
  const handleDeath = useCallback(
    function handleDeath() {

      disable()

      const dir = new THREE.Vector3()
      dir.subVectors(playerBody.current.position, coronaBody.current.position).normalize();

      coronaBodyApi.applyLocalImpulse([-4 * dir.x, 2, -4 * dir.z], [0, 0, 0])
    },
    [disable, coronaBody, coronaBodyApi, playerBody]
  )

  // HANDLE CORONA ATTACK STATE
  const handleAttack = useCallback(() => {
    attackPosition.current = lock.current.position.clone()

    const dir = new THREE.Vector3()
    dir.subVectors(playerBody.current.position, coronaBody.current.position).normalize();

    const { x, y, z } = dir.multiplyScalar(0.75).add(coronaBody.current.position)
    lockApi.position.set(x, y, z)

    setTimeout(() => {
      const { x, y, z } = attackPosition.current
      lockApi.position.set(x, y, z)
      send("PRE_ATTACK")
    }, ATTACK_DURATION)
  },
  [send, playerBody, lock, coronaBody, lockApi, attackPosition])

  useEffect(() => {
    if (isAttacking) { handleAttack() }
    if (isDead) { handleDeath() }
  }, [isAttacking, isDead, handleAttack, handleDeath])

  useFrame(function () {
    
    if (isIdle || isSeeking)  {
      const velocityFactor = isIdle ? IDLE_VELOCITY : SEEK_VELOCITY
      
      const { coords, time } = additiveOrientation.current
      
      lockApi.position.set(
        lock.current.position.x + (orientation.current.x + (coords[0] / time)) * velocityFactor,
        initPosition[1],
        lock.current.position.z + (orientation.current.z + (coords[2] / time)) * velocityFactor
      )
      
      additiveOrientation.current.time += 0.01
    }

    renderingGroup.current.position.copy(coronaBody.current.position)

    if (isDead) {
      renderingGroup.current.rotation.copy(coronaBody.current.rotation)
    }

  })

  return (
    <>
      <mesh ref={lock} />
      <mesh ref={coronaBody} userData={{ type: COLLISION_GROUP.CORONA, id }} />

      <group ref={renderingGroup} scale={[0.2, 0.2, 0.2]}>
        <CoronaRenderer
          onDeathAnimEnd={() => send("DEATH")}
          isSeeking={isSeeking}
          isPreattacking={isPreattacking}
          isSpawning={isSpawning}
          isDead={isDead}
        />
        {!isDead && <CoronaUI seekAlert={seekAlert} isUnderAttack={isUnderAttack} />}
      </group>

      <CoronaHowler isUnderAttack={isUnderAttack} seekAlert={seekAlert} />
    </>
  )
})

const CoronaUI = React.memo(function CoronaUI({
  seekAlert,
  isUnderAttack
}) {

  return (
    <Suspense fallback={null}>
      <Exclamation position={[0, 2.5, 0]} scale={[2, 2, 1]} visible={seekAlert} />
      <Pow position={[0, 1.5, 0]} scale={[2, 2, 1]} visible={isUnderAttack} />
    </Suspense>
  )
})

const CoronaHowler = React.memo(function CoronaHowler({ isUnderAttack, seekAlert }) {

  const [playHitSfx] = useSound(HitSfx)
  const [playHitSfx2] = useSound(HitSfx2)
  const [playAlertSfx] = useSound(alertSfx)

  useEffect(() => void (seekAlert && playAlertSfx()), [seekAlert, playAlertSfx])
  useEffect(() => void (isUnderAttack && (Math.random() > 0.5 ? playHitSfx() : playHitSfx2())), [isUnderAttack, playHitSfx, playHitSfx2])

  return null
})

export const CoronaRenderer = React.memo(
  function CoronaRenderer(props) {
    const {
      onDeathAnimEnd,
      isSeeking,
      isPreattacking,
      isDead,
      isSpawning
    } = props

    const rand = React.useRef(Math.floor(Math.random() * 10) + 1)

    const time = useRef()
    const group = useRef()
    const rotationGroup = useRef()
    const coronaMesh = useRef()
    const positionGroup = useRef()

    const { coronaNodes: nodes, fiveTone } = useAssets(s => s)

    const { addOutline, removeOutline } = useOutline(s => s)

    const [resourceRef, material] = useResource()

    const [springProps, set] = useSpring(() => ({ opacity: 1, config: config.molasses }))

    const handleDeath = useCallback(() => {
      removeOutline(coronaMesh.current)
      set({ opacity: 0, config: config.molasses, onRest: onDeathAnimEnd })
    }, [removeOutline, set, onDeathAnimEnd])

    useEffect(() => void (isDead && handleDeath()), [isDead, handleDeath])
    
    useEffect(() => void ((isPreattacking || isSpawning) && (time.current = 0)), [isPreattacking, isSpawning, time])

    useEffect(() => void addOutline(coronaMesh.current), [addOutline, group]);

    useFrame(({ clock }) => {
      if (isDead) return

      const multiplier = 10 * (isSeeking ? 2 : 1)

      positionGroup.current.position.y = Math.sin(rand.current + clock.elapsedTime * multiplier) * 0.5

      const h = 1 - Math.sin(rand.current + clock.elapsedTime * multiplier) / 8
      const v = 1 + Math.sin(rand.current + clock.elapsedTime * multiplier) / 10

      coronaMesh.current.scale.x = h
      coronaMesh.current.scale.z = h
      coronaMesh.current.scale.y = v

      if (isPreattacking) {
        rotationGroup.current.rotation.y = easeInQuad(time.current)
        time.current += 0.1
      }
      if (isSpawning) {
        rotationGroup.current.rotation.y = easeInQuad(time.current)

        coronaMesh.current.scale.x = 1 + 1.5 * easeInElastic(time.current / 8) 
        coronaMesh.current.scale.z = 1 + 1.5 * easeInElastic(time.current / 8) 
        coronaMesh.current.scale.y = 1 + 1.5 * easeInElastic(time.current / 8) 
  
        time.current += 0.05
      }
    })

    return (
      <>
        <a.meshToonMaterial
          transparent
          color={isDead ? 0xff0000 : 0x1E9983}
          shininess={0}
          specular={0xffffff}
          ref={resourceRef}
          gradientMap={fiveTone}
          {...springProps}
        />

        <group ref={group} dispose={null} >

          <group ref={rotationGroup}>
            <group ref={positionGroup}>
              <mesh material={material} ref={coronaMesh} geometry={nodes?.Cube?.geometry} />
            </group>
          </group>

          <CoronaShadow isDead={isDead} positionGroup={positionGroup} />

        </group>

      </>
    )
  }
)

const CoronaShadow = React.memo(
  function CoronaShadow(props) {
    const { isDead, positionGroup } = props
    const shadow = useRef()

    const shadowTexture = useAssets(s => s.coronaShadow)

    useFrame(() => {
      shadow.current.material.opacity = THREE.MathUtils.lerp(.6, .1, positionGroup.current.position.y);
      shadow.current.scale.x = THREE.MathUtils.lerp(4, 2, positionGroup.current.position.y);
      shadow.current.scale.y = THREE.MathUtils.lerp(4, 2, positionGroup.current.position.y);
    })

    return (
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[4, 4, 4]} visible={!isDead} >
        <planeBufferGeometry attach="geometry" args={[0.5, 0.5]} />
        <meshBasicMaterial
          attach="material"
          map={shadowTexture}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
    )
})

export default PhyCorona