import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

const scenes = [
  {
    to: '/glb',
    title: 'GLB Textures',
    emoji: '🖼️',
    desc: 'Why GLB models lose textures in Three.js and how to fix it — colorSpace, envMap, and texture encoding.',
  },
  {
    to: '/quad',
    title: 'Quad Faces',
    emoji: '🔳',
    desc: 'How GPUs triangulate quads, why face normals matter, and how to visualise the underlying triangle mesh.',
  },
  {
    to: '/materials',
    title: 'Materials',
    emoji: '✨',
    desc: 'Compare MeshBasicMaterial, MeshStandardMaterial and MeshPhysicalMaterial. Tweak roughness, metalness, and transmission.',
  },
  {
    to: '/lighting',
    title: 'Lighting',
    emoji: '💡',
    desc: 'Explore AmbientLight, DirectionalLight, PointLight, SpotLight and HDRI environment maps side by side.',
  },
] as const

function HomePage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Interactive 3D Learning</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Three.js Learning Lab
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Hands-on interactive scenes for mastering Three.js — textures, geometry,
          materials, and lighting. Built with React Three Fiber and TanStack Start.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {scenes.map(({ to, title, emoji, desc }, index) => (
          <Link
            key={to}
            to={to}
            className="island-shell feature-card rise-in block rounded-2xl p-6 no-underline transition hover:-translate-y-1"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <div className="mb-3 text-3xl">{emoji}</div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
