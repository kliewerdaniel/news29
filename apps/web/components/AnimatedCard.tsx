"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import React from "react";
import { Variants } from "framer-motion"; // Import Variants

type AnimatedCardProps = {
  children: React.ReactNode;
  variants: Variants; // Use Variants type
  index: number;
};

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, variants, index }) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
    >
      <Card>{children}</Card>
    </motion.div>
  );
};

export default AnimatedCard;
