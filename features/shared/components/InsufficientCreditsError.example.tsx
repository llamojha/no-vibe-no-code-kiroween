/**
 * Example usage of InsufficientCreditsError component
 *
 * This file demonstrates how to use the InsufficientCreditsError component
 * in different scenarios within the application.
 */

import React from "react";
import InsufficientCreditsError from "./InsufficientCreditsError";

// Example 1: Basic usage with zero credits
export const BasicExample = () => {
  return <InsufficientCreditsError credits={0} />;
};

// Example 2: With custom callback for getting more credits
export const WithCallbackExample = () => {
  const handleGetMoreCredits = () => {
    // Navigate to purchase page or show upgrade modal
    console.log("Navigating to purchase page...");
    // window.location.href = '/purchase-credits';
  };

  return (
    <InsufficientCreditsError
      credits={0}
      onGetMoreCredits={handleGetMoreCredits}
    />
  );
};

// Example 3: In an analysis form context
export const InAnalysisFormExample = () => {
  const [hasError, setHasError] = React.useState(false);
  const [credits, setCredits] = React.useState(0);

  const handleAnalyze = async () => {
    // Check credits before analysis
    if (credits === 0) {
      setHasError(true);
      return;
    }

    // Proceed with analysis...
  };

  return (
    <div>
      {hasError && (
        <InsufficientCreditsError
          credits={credits}
          onGetMoreCredits={() => {
            // Handle getting more credits
            console.log("Get more credits");
          }}
        />
      )}

      <button onClick={handleAnalyze}>Analyze Idea</button>
    </div>
  );
};

// Example 4: Catching API errors
export const WithAPIErrorExample = () => {
  const [error, setError] = React.useState<{ credits?: number } | null>(null);

  const analyzeIdea = async (idea: string) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ idea }),
      });

      if (response.status === 429) {
        // Insufficient credits error
        const errorData = await response.json();
        setError({ credits: errorData.details?.credits || 0 });
        return;
      }

      // Handle success...
    } catch (err) {
      console.error("Analysis failed", err);
    }
  };

  return (
    <div>
      {error && (
        <InsufficientCreditsError
          credits={error.credits || 0}
          onGetMoreCredits={() => {
            // Navigate to purchase page
            window.location.href = "/purchase-credits";
          }}
        />
      )}
    </div>
  );
};
