import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { format } from "date-fns";
import { z } from "zod";
import { motion } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

// Schema for article frontmatter
const ArticleSchema = z.object({
  persona: z.string(),
  topic: z.string(),
  date: z.string(),
  style: z.string().optional(),
  tone: z.string().optional(),
  published: z.boolean().optional(),
  scheduled: z.string().optional(),
});

type Article = z.infer<typeof ArticleSchema> & {
  filePath: string;
  content: string;
};

async function getArticles(): Promise<Article[]> {
  const articlesDir = path.join(process.cwd(), "data/articles");
  const articles: Article[] = [];

  try {
    // Get all persona directories
    const personas = await fs.readdir(articlesDir);

    for (const persona of personas) {
      const personaPath = path.join(articlesDir, persona);
      const stat = await fs.stat(personaPath);
      
      if (!stat.isDirectory()) continue;

      // Read all MDX files in the persona directory
      const files = await fs.readdir(personaPath);
      const mdxFiles = files.filter(file => file.endsWith(".mdx"));

      for (const file of mdxFiles) {
        const filePath = path.join(personaPath, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const { data, content } = matter(fileContent);

        // Validate frontmatter
        const validatedData = ArticleSchema.parse(data);

        articles.push({
          ...validatedData,
          filePath,
          content,
        });
      }
    }
  } catch (error) {
    console.error("Error reading articles:", error);
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function updateArticle(article: Article) {
  const fileContent = matter.stringify(article.content, {
    persona: article.persona,
    topic: article.topic,
    date: article.date,
    style: article.style,
    tone: article.tone,
    published: article.published,
    scheduled: article.scheduled,
  });

  await fs.writeFile(article.filePath, fileContent, "utf-8");
}

function getStatus(article: Article) {
  if (article.published) return "published";
  if (article.scheduled) {
    const scheduledDate = new Date(article.scheduled);
    if (scheduledDate > new Date()) return "scheduled";
    return "published";
  }
  return "draft";
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    published: "bg-green-100 text-green-800",
    scheduled: "bg-orange-100 text-orange-800",
    draft: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

export default async function PublishPage() {
  const articles = await getArticles();

  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Article Publishing Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Style/Tone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article, index) => (
                  <TableRow key={article.filePath}>
                    <TableCell>{article.topic}</TableCell>
                    <TableCell>{article.persona}</TableCell>
                    <TableCell>
                      {article.style && article.tone ? 
                        `${article.style} / ${article.tone}` : 
                        "Not specified"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getStatus(article)} />
                    </TableCell>
                    <TableCell>{format(new Date(article.date), "PPP")}</TableCell>
                    <TableCell className="space-x-2">
                      <form action={async () => {
                        "use server";
                        await updateArticle({
                          ...article,
                          published: true,
                          scheduled: undefined,
                        });
                      }}>
                        <Button 
                          type="submit" 
                          variant="default"
                          disabled={article.published}
                        >
                          Publish Now
                        </Button>
                      </form>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Schedule</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Publication</DialogTitle>
                          </DialogHeader>
                          <Calendar
                            mode="single"
                            selected={article.scheduled ? new Date(article.scheduled) : undefined}
                            onSelect={async (date: Date | undefined) => {
                              if (!date) return;
                              await updateArticle({
                                ...article,
                                scheduled: date.toISOString(),
                                published: false,
                              });
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      {(article.published || article.scheduled) && (
                        <form action={async () => {
                          "use server";
                          await updateArticle({
                            ...article,
                            published: false,
                            scheduled: undefined,
                          });
                        }}>
                          <Button type="submit" variant="destructive">
                            Unpublish
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
