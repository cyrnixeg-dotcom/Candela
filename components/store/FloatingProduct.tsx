"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  description: string;
  isFeatured: boolean;
  inStock: boolean;
}

interface FloatingProductProps {
  product: Product;
  index: number;
}

export default function FloatingProduct({ product, index }: FloatingProductProps) {
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect state
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const floatDelay = (index * 0.7) % 3;
  const floatDuration = 4 + (index * 0.5) % 2;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      subcategory: product.subcategory,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      className="group relative"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="product-card relative bg-white/90 backdrop-blur-sm border border-candela-pink/15 overflow-hidden flex flex-col rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300"
        style={{
          boxShadow: "0 4px 20px rgba(244,167,185,0.12)",
        }}
        whileHover={{
          y: -6,
          boxShadow: "0 16px 36px rgba(244,167,185,0.25)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Product image link */}
        <Link
          href={`/product/${product.id}`}
          className="block relative aspect-square overflow-hidden bg-gradient-to-b from-candela-cream/60 to-white/40 cursor-pointer"
        >
          <Image
            src={(product.image || "/images/logo.jpg").replace(/\.jpg$/, ".png")}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/logo.jpg";
            }}
          />

          {/* Sparkle effects on hover */}
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                  className="absolute top-4 right-8 w-3 h-3 text-candela-pink"
                >✨</motion.div>
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  className="absolute bottom-8 left-6 w-4 h-4 text-candela-gold"
                >✨</motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Featured badge */}
          {product.isFeatured && (
            <div className="absolute top-3 left-3 z-10" style={{ transform: "translateZ(40px)" }}>
              <span className="px-2.5 py-1 bg-gradient-to-r from-candela-pink to-candela-gold text-white text-[9px] font-body font-bold tracking-[0.2em] uppercase rounded-full shadow-md">
                ✦ Featured
              </span>
            </div>
          )}

          {/* Out of stock */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="font-body text-xs text-candela-charcoal tracking-widest uppercase font-semibold">
                Out of Stock
              </span>
            </div>
          )}

          {/* View Details hover badge */}
          <div className="absolute inset-0 bg-candela-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-candela-black rounded-full font-body text-[11px] font-bold tracking-widest uppercase shadow-md">
              View Details →
            </span>
          </div>
        </Link>

        {/* Product info */}
        <div className="p-4 text-center bg-white/60 backdrop-blur-sm relative z-20 flex-1 flex flex-col justify-between">
          <div>
            <p className="font-body text-[10px] text-candela-pink tracking-[0.25em] uppercase mb-1 font-semibold">
              {product.subcategory}
            </p>
            <Link href={`/product/${product.id}`} className="block">
              <h3 className="font-display text-lg text-candela-charcoal font-medium leading-snug mb-1 hover:text-candela-pink-deep transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
            <p className="font-body text-candela-black font-semibold tracking-wider text-sm">
              {product.price} EGP
            </p>
          </div>

          {/* Add to Bag Button */}
          {product.inStock ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-3 w-full py-2.5 px-4 bg-candela-pink/15 hover:bg-candela-pink-deep hover:text-white text-candela-pink-deep rounded-xl font-body text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <span>🛍️</span>
              Add to Bag
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="mt-3 w-full py-2.5 px-4 bg-gray-100 text-gray-400 rounded-xl font-body text-[11px] font-bold tracking-[0.15em] uppercase cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
