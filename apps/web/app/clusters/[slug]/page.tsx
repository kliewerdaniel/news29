import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import fs from "fs/promises";
import path from "path";
import * as yaml from "js-yaml";
import { ClusterClient } from "./client";

export type NewsCluster = {
  topic: string;
  summary: string;
  articles: {
    title: string;
    url: string;
    source: string;
  }[];
};

export type Persona = {
  name: string;
  skepticism?: number;
  empathy?: number;
  confidence?: number;
  [trait: string]: unknown;
};

export default async function ClusterPage({ params }: { params: { slug: string } }) {
  const cluster: NewsCluster = await fs.readFile(
    path.join(process.cwd(), `data/clusters/${params.slug}.json`),
    "utf-8"
  ).then(JSON.parse);

  const personaFiles = await fs.readdir("data/personas");
  const personas = await Promise.all(
    personaFiles.map(async (file) => {
      const yamlText = await fs.readFile(`data/personas/${file}`, "utf-8");
      const parsed = yaml.load(yamlText) as Persona;
      return { ...parsed, slug: file.replace(/\.yaml$/, "") };
    })
  );

  return <ClusterClient cluster={cluster} personas={personas} />;
}
