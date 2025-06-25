import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PersonaPreviewProps {
  curiosity: number;
  empathy: number;
  skepticism: number;
  humor: number;
  confidence: number;
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const PersonaPreview: React.FC<PersonaPreviewProps> = ({
  empathy,
  skepticism,
  humor,
}) => {
  const generateSimulatedParagraph = () => {
    let paragraph =
      "This is a neutral explanatory voice, providing clear and concise information.";

    if (empathy > 0.7) {
      paragraph +=
        " I understand your perspective and want to help you navigate this topic with care and consideration.";
    }
    if (skepticism > 0.7) {
      paragraph +=
        " However, it's important to critically evaluate all claims and consider potential biases or alternative interpretations.";
    }
    if (humor > 0.7) {
      paragraph +=
        " And remember, even serious topics can have a lighter side – like trying to explain quantum physics to a cat!";
    }

    return paragraph;
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Sample Output</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{generateSimulatedParagraph()}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
