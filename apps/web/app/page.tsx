"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HomePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col items-center justify-center p-24"
    >
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-6xl font-bold text-center">Dynamic News Engine</h1>
        <div className="flex gap-4">
          <Link href="/personas/new" passHref>
            <Button variant="default">Create a Persona</Button>
          </Link>
          <Link href="/clusters" passHref>
            <Button variant="default">View News Clusters</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
