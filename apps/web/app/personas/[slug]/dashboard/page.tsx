import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { motion } from "framer-motion";

interface TraitHistory {
  [key: string]: Array<{
    date: Date;
    value: number;
  }>;
}

interface PersonaVersion {
  traits: {
    [key: string]: number;
  };
  createdAt?: string;
}

interface Article {
  title: string;
  publishDate: string;
  cluster: string;
  path: string;
}

interface DebateResponse {
  persona: string;
  cluster: string;
  content: string;
  timestamp: string;
}

export default async function PersonaDashboard({ params }: { params: { slug: string } }) {
  // 1. Load and parse all YAML versions
  const personaDir = path.join(process.cwd(), "data/personas", params.slug);
  const files = await fs.readdir(personaDir);
  const yamlFiles = files.filter(f => f.endsWith(".yaml"));

  const versions: PersonaVersion[] = await Promise.all(
    yamlFiles.map(async file => {
      const content = await fs.readFile(path.join(personaDir, file), "utf-8");
      const data = yaml.load(content) as PersonaVersion;
      // Use file timestamp if createdAt not in YAML
      if (!data.createdAt) {
        const stats = await fs.stat(path.join(personaDir, file));
        data.createdAt = stats.birthtime.toISOString();
      }
      return data;
    })
  );

  // 2. Load debates
  const debatesDir = path.join(process.cwd(), "data/debates");
  let debates: DebateResponse[] = [];
  try {
    const debateFiles = await fs.readdir(debatesDir);
    const jsonFiles = debateFiles.filter(f => f.endsWith(".json"));
    
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(debatesDir, file), "utf-8");
      const debate = JSON.parse(content);
      // Filter responses by this persona
      const responses = debate.responses?.filter((r: any) => 
        r.persona.toLowerCase() === params.slug.toLowerCase()
      ) || [];
      
      debates.push(...responses.map((r: any) => ({
        persona: r.persona,
        cluster: debate.cluster || "Unknown",
        content: r.content,
        timestamp: r.timestamp || new Date().toISOString()
      })));
    }
  } catch (e) {
    console.log("No debates found");
  }
  
  // Sort debates by timestamp
  debates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // 3. Load articles
  const articlesDir = path.join(process.cwd(), "data/articles", params.slug);
  let articles: Article[] = [];
  try {
    const articleFiles = await fs.readdir(articlesDir);
    articles = await Promise.all(
      articleFiles.map(async file => {
        const content = await fs.readFile(path.join(articlesDir, file), "utf-8");
        const stats = await fs.stat(path.join(articlesDir, file));
        return {
          title: file.replace(".mdx", ""),
          publishDate: stats.birthtime.toISOString(),
          cluster: "TBD", // Would need to parse MDX frontmatter
          path: `/personas/${params.slug}/articles/${file.replace(".mdx", "")}`
        };
      })
    );
  } catch (e) {
    // Directory may not exist if no articles yet
    console.log("No articles found");
  }

  // 3. Compute trait history
  const traitHistory: TraitHistory = {};
  versions.forEach(version => {
    Object.entries(version.traits).forEach(([trait, value]) => {
      if (!traitHistory[trait]) {
        traitHistory[trait] = [];
      }
      traitHistory[trait].push({
        date: new Date(version.createdAt!),
        value
      });
    });
  });

  // Sort history by date
  Object.values(traitHistory).forEach(history => {
    history.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  // Calculate trait deltas
  const traitDeltas = Object.entries(traitHistory).map(([trait, history]) => ({
    trait,
    delta: history[history.length - 1].value - history[0].value
  }));

  // Format data for charts
  const chartData = Object.entries(traitHistory).map(([trait, history]) => ({
    name: trait,
    data: history.map(h => ({
      date: h.date.toLocaleDateString(),
      value: h.value
    }))
  }));

  // Radar chart data
  const currentTraits = Object.fromEntries(
    Object.entries(traitHistory).map(([trait, history]) => [
      trait,
      history[history.length - 1].value
    ])
  );

  const radarData = [
    {
      ...currentTraits,
      name: "Current Traits"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-4">
          {params.slug} Dashboard
        </h1>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traits">Traits</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trait Evolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        {chartData.map((series, idx) => (
                          <Line
                            key={series.name}
                            type="monotone"
                            data={series.data}
                            dataKey="value"
                            name={series.name}
                            stroke={`hsl(${idx * 45}, 70%, 50%)`}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Trait Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis />
                        <Radar
                          name="Traits"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traits">
            <Card>
              <CardHeader>
                <CardTitle>Trait Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trait</TableHead>
                      <TableHead>Change Since Origin</TableHead>
                      <TableHead>Current Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traitDeltas.map(({ trait, delta }) => (
                      <TableRow key={trait}>
                        <TableCell className="font-medium">{trait}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={delta > 0 ? "default" : "secondary"}>
                                  {delta > 0 ? "↑" : "↓"} {delta.toFixed(2)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Change since first version</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{currentTraits[trait].toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Published Articles ({articles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                {articles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Cluster</TableHead>
                        <TableHead>Published</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => (
                        <TableRow key={article.path}>
                          <TableCell>
                            <a href={article.path} className="text-blue-500 hover:underline">
                              {article.title}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{article.cluster}</Badge>
                          </TableCell>
                          <TableCell>{new Date(article.publishDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No articles published yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Debates ({debates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {debates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cluster</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debates.map((debate, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{debate.cluster}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  {debate.content.substring(0, 100)}...
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-sm whitespace-normal">{debate.content}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{new Date(debate.timestamp).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No debates joined yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
