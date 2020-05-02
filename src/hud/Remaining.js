import React, { useEffect } from 'react'
import { TweenLite } from 'gsap'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'
import { useCorona } from '../store'

const colors = [
  "#161616",
  "#333333",
  "#1E9983",
].map(col => `#${new THREE.Color(col).convertSRGBToLinear().getHexString()}`)

// Objects
class RemainingController {
  constructor(x, y, ctx, canvas, n) {
    this.border = 6;
    this.radius = 55 + this.border;

    this.x = x + this.border;
    this.y = y + this.border;

    this.offset = {
      x: 0,
      y: 0
    };

    this.max = n
    this.remaining = this.max;
    this.canvas = canvas
    this.c = ctx
  }

  draw() {

    // main
    this.c.font = "82px Bangers";
    this.c.textAlign = "center";
    this.c.fillStyle = "white";
    this.c.textBaseline = "middle";

    this.c.shadowOffsetX = 6;
    this.c.shadowOffsetY = 6;

    this.c.shadowColor = colors[0];

    this.c.fillText(
      this.remaining,
      -this.offset.x + this.x + this.radius + 8,
      -this.offset.y + this.y + this.radius - 16
    );

    this.c.font = "16px Bangers";

    this.c.fillText(
      "left",
      this.x + this.radius + 8 + 20,
      this.y + this.radius + 30
    );

    this.c.shadowColor = "transparent";
  }

  remove() {
    const offset = {
      x: 0,
      y: 0
    };

    const shake = 10;

    const tween = TweenLite.fromTo(
      offset,
      0.12,
      {
        x: -shake,
        y: 0
      },
      {
        x: shake,
        y: 0,
        repeat: 2,
        yoyo: true,
        onUpdate: () => {
          this.offset.x = offset.x;
          this.offset.y = offset.y;
        },
        onComplete: () => {
          this.offset.x = 0;
          this.offset.y = 0;
        }
      }
    );
  }

  update(t) {
    this.c.fillStyle = "transparent";
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.draw();
  }
}

export default function Health() {

  const canvas = React.useRef()
  const ctx = React.useRef()
  const remainingController = React.useRef()

  const spriteMaterial = React.useRef()

  const coronas = useCorona(s => s.coronas)

  useEffect(() => {
    canvas.current = document.createElement('canvas')

    canvas.current.width = 1024
    canvas.current.height = 1024

    ctx.current = canvas.current.getContext('2d')

    ctx.current.scale(4, 4)

    // set this to number of initial coronas, to draw proportianl fill of green circle
    remainingController.current = new RemainingController(40, 40, ctx.current, canvas.current, 20)
  }, [])

  useEffect(() => {
    remainingController.current.remaining = coronas.length
    remainingController.current.remove()
  }, [coronas])

  useFrame(() => {
    if (ctx.current) {
      remainingController.current.update()

      const canvasTexture = new THREE.CanvasTexture(canvas.current);
      spriteMaterial.current.map = canvasTexture
    }
  })

  return (
    <sprite position={[window.innerWidth / 2 - 120, -window.innerHeight / 2 + 80, 1]} scale={[256, 256, 256]}>
      <spriteMaterial
        attach="material"
        fog={false}
        ref={spriteMaterial}
      />
    </sprite>
  )

}