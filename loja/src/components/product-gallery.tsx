'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Image as ShopifyImage } from '@/lib/shopify'

export function ProductGallery({ images, title }: { images: ShopifyImage[]; title: string }) {
  const [index, setIndex] = useState(0)
  const current = images[index]
  if (!current) return null

  return (
    <div className="md:sticky md:top-28">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white shadow-soft">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.url}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Image src={current.url} alt={current.altText || title} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setIndex(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white transition ${
                i === index ? 'ring-2 ring-royal ring-offset-2' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
