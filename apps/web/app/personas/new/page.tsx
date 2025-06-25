"use client";
import React from 'react';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import yaml from "js-yaml";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonaPreview } from "@/components/persona/PersonaPreview";

const formSchema = z.object({
  name: z.string().min(1).max(50),
  curiosity: z.number().min(0).max(1),
  empathy: z.number().min(0).max(1),
  skepticism: z.number().min(0).max(1),
  humor: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

type PersonaFormValues = z.infer<typeof formSchema>;

export default function CreatePersonaPage() {
  const { toast } = useToast();
  const [isSaving, startSaving] = React.useTransition();

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      curiosity: 0.5,
      empathy: 0.5,
      skepticism: 0.5,
      humor: 0.5,
      confidence: 0.5,
    },
  });

  async function onSubmit(values: PersonaFormValues) {
    startSaving(async () => {
      try {
        const res = await fetch("/api/personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Unknown error");
        }

        const data = await res.json();
        toast({
          title: "Success!",
          description: `Persona saved to ${data.path}`,
        });
        form.reset(); // Reset form after successful save
      } catch (error: any) {
        toast({
          title: "Error saving persona",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }

  const traits = [
    { name: "curiosity", label: "Curiosity" },
    { name: "empathy", label: "Empathy" },
    { name: "skepticism", label: "Skepticism" },
    { name: "humor", label: "Humor" },
    { name: "confidence", label: "Confidence" },
  ] as const;

  const formValues = form.watch();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center min-h-screen bg-blue-200 p-4"
    >
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create New Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">Persona Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Curious Explorer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {traits.map((trait) => (
                  <FormField
                    key={trait.name}
                    control={form.control}
                    name={trait.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">{trait.label}</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl className="flex-grow">
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <span className="w-12 text-right text-sm font-mono">
                            {field.value.toFixed(2)}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Persona"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <PersonaPreview {...formValues} />
      </div>
    </motion.div>
  );
}
