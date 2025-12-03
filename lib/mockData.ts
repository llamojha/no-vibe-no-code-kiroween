/**
 * Mock Data Generator for Local Development Mode
 *
 * Generates realistic sample analysis data for both startup ideas and hackathon projects.
 * Ensures mock data covers different score ranges and analysis types with consistent
 * user associations and timestamps.
 */

import { SavedAnalysisRecord, SavedHackathonAnalysis, UserTier } from "./types";

// Mock user for local development
export interface LocalDevUser {
  id: string;
  email: string;
  tier: UserTier;
  created_at: string;
}

/**
 * Generate a consistent mock user for local development
 */
export function generateMockUser(): LocalDevUser {
  return {
    id: "local-dev-user-001",
    email: "developer@localhost.dev",
    tier: "free",
    created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
  };
}

/**
 * Generate mock startup idea analyses with varying scores and content
 */
export function generateMockStartupAnalyses(): SavedAnalysisRecord[] {
  const mockUser = generateMockUser();
  const baseDate = new Date("2024-10-15T00:00:00Z");

  const mockAnalyses: SavedAnalysisRecord[] = [
    {
      id: "mock-analysis-001",
      userId: mockUser.id,
      idea: "AI-powered personal fitness coach that creates custom workout plans based on your body type, goals, and available equipment",
      createdAt: new Date(
        baseDate.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // 2 days later
      audioBase64: null,
      analysisType: "idea",
      analysis: {
        detailedSummary:
          "This AI fitness coach concept shows strong potential in the growing health tech market. The personalization aspect addresses a key pain point where generic workout plans often fail to deliver results. The integration of body type analysis and equipment availability creates a comprehensive solution that could differentiate from existing fitness apps.",
        founderQuestions: [
          {
            question:
              "How will you acquire the initial dataset for body type analysis?",
            ask: "What partnerships or data collection methods will you use to train your AI models?",
            why: "The accuracy of your AI recommendations depends heavily on having diverse, high-quality training data",
            source: "Technical feasibility assessment",
            analysis:
              "This is critical for the core value proposition and will require significant upfront investment",
          },
          {
            question:
              "What's your strategy for user retention beyond the initial excitement?",
            ask: "How will you keep users engaged when motivation naturally wanes after 2-3 weeks?",
            why: "Fitness apps typically see 80% user churn within the first month",
            source: "Market research on fitness app retention",
            analysis:
              "Long-term success depends on solving the motivation and habit-formation challenge",
          },
        ],
        swotAnalysis: {
          strengths: [
            "Addresses clear market need for personalized fitness solutions",
            "AI-driven approach allows for scalable customization",
            "Equipment-based planning reduces barriers to entry",
          ],
          weaknesses: [
            "High development costs for AI training and validation",
            "Requires significant user data collection for effectiveness",
            "Complex user onboarding process",
          ],
          opportunities: [
            "Growing health consciousness post-pandemic",
            "Integration with wearable devices and health platforms",
            "Corporate wellness program partnerships",
          ],
          threats: [
            "Competition from established players like Nike Training Club",
            "Privacy concerns around body data collection",
            "Regulatory changes in health data handling",
          ],
        },
        currentMarketTrends: [
          {
            trend:
              "Personalized health and wellness solutions are experiencing 25% YoY growth",
            impact: "Strong tailwinds for AI-driven fitness applications",
          },
          {
            trend: "Home fitness market expanded 170% during 2020-2022",
            impact: "Increased demand for equipment-flexible workout solutions",
          },
        ],
        scoringRubric: [
          {
            name: "Market Opportunity",
            score: 8,
            justification:
              "Large and growing market with clear demand for personalization",
          },
          {
            name: "Technical Feasibility",
            score: 6,
            justification:
              "AI technology exists but requires significant development and training data",
          },
          {
            name: "Competitive Advantage",
            score: 7,
            justification:
              "Personalization and equipment integration provide differentiation",
          },
          {
            name: "Revenue Potential",
            score: 7,
            justification:
              "Multiple monetization paths through subscriptions and partnerships",
          },
          {
            name: "Execution Risk",
            score: 5,
            justification:
              "High technical complexity and user acquisition challenges",
          },
        ],
        competitors: [
          {
            name: "Nike Training Club",
            description:
              "Free fitness app with workout videos and training plans",
            strengths: [
              "Strong brand recognition",
              "High-quality content",
              "Free tier",
            ],
            weaknesses: ["Limited personalization", "Generic workout plans"],
            sourceLink: "https://www.nike.com/ntc-app",
          },
          {
            name: "Freeletics",
            description:
              "AI-powered fitness coach with bodyweight and equipment workouts",
            strengths: [
              "AI-driven adaptation",
              "No equipment needed",
              "Strong community",
            ],
            weaknesses: [
              "Limited body type analysis",
              "Subscription required for full features",
            ],
          },
        ],
        monetizationStrategies: [
          {
            name: "Freemium Subscription",
            description:
              "Basic workouts free, advanced AI features and nutrition plans premium",
          },
          {
            name: "Corporate Wellness",
            description:
              "B2B sales to companies for employee wellness programs",
          },
          {
            name: "Equipment Partnerships",
            description:
              "Affiliate commissions from recommended fitness equipment",
          },
        ],
        improvementSuggestions: [
          {
            title: "Start with a specific niche",
            description:
              "Focus on home workouts for busy professionals before expanding to gym-based routines",
          },
          {
            title: "Partner with fitness professionals",
            description:
              "Collaborate with certified trainers to validate AI recommendations and build credibility",
          },
          {
            title: "Implement social features early",
            description:
              "Add community elements and progress sharing to improve retention",
          },
        ],
        nextSteps: [
          {
            title: "Validate core assumptions",
            description:
              "Survey 100+ potential users about their fitness pain points and willingness to pay",
          },
          {
            title: "Build MVP with manual curation",
            description:
              "Create initial version with human trainers before investing in AI development",
          },
          {
            title: "Secure fitness industry partnerships",
            description:
              "Connect with gyms, trainers, or equipment manufacturers for data and validation",
          },
        ],
        finalScore: 6.6,
        finalScoreExplanation:
          "Strong market opportunity with clear user need, but significant technical and execution challenges. The personalization angle is compelling, but success depends heavily on AI quality and user retention strategies.",
        viabilitySummary:
          "Viable with proper execution and sufficient funding for AI development. Focus on proving product-market fit with a simpler version before building complex AI features.",
      },
    },
    {
      id: "mock-analysis-002",
      userId: mockUser.id,
      idea: "Subscription service for locally-sourced, seasonal meal kits with zero-waste packaging",
      createdAt: new Date(
        baseDate.getTime() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(), // 5 days later
      audioBase64: null,
      analysisType: "idea",
      analysis: {
        detailedSummary:
          "This sustainable meal kit concept taps into growing environmental consciousness and local food movements. The zero-waste packaging differentiator addresses a major criticism of existing meal kit services. However, the operational complexity of managing local supplier networks and seasonal variations presents significant challenges.",
        founderQuestions: [
          {
            question:
              "How will you manage supply chain complexity across different regions?",
            ask: "What's your strategy for maintaining consistent quality and availability with local suppliers?",
            why: "Local sourcing creates operational challenges that scale poorly without proper systems",
            source: "Supply chain analysis",
            analysis:
              "This operational complexity could make or break the business model",
          },
        ],
        swotAnalysis: {
          strengths: [
            "Strong environmental value proposition",
            "Supports local economies and farmers",
            "Differentiated from major players like Blue Apron",
          ],
          weaknesses: [
            "Higher operational complexity than centralized meal kits",
            "Seasonal limitations on ingredient availability",
            "Higher costs due to local sourcing premium",
          ],
          opportunities: [
            "Growing consumer demand for sustainable options",
            "Potential partnerships with local farms and co-ops",
            "Corporate sustainability program sales",
          ],
          threats: [
            "Major meal kit companies adding sustainable options",
            "Economic downturns affecting premium pricing tolerance",
            "Supply chain disruptions affecting local suppliers",
          ],
        },
        currentMarketTrends: [
          {
            trend: "Sustainable packaging market growing 15% annually",
            impact: "Strong consumer demand for eco-friendly alternatives",
          },
        ],
        scoringRubric: [
          {
            name: "Market Opportunity",
            score: 7,
            justification:
              "Growing sustainability market with clear consumer demand",
          },
          {
            name: "Technical Feasibility",
            score: 4,
            justification:
              "Complex supply chain management and logistics challenges",
          },
          {
            name: "Competitive Advantage",
            score: 8,
            justification:
              "Strong differentiation through sustainability and local sourcing",
          },
          {
            name: "Revenue Potential",
            score: 6,
            justification: "Premium pricing possible but limited market size",
          },
          {
            name: "Execution Risk",
            score: 3,
            justification: "High operational complexity and supply chain risks",
          },
        ],
        competitors: [
          {
            name: "Blue Apron",
            description: "Leading meal kit delivery service",
            strengths: [
              "Established brand",
              "Efficient logistics",
              "Scale advantages",
            ],
            weaknesses: ["Limited sustainability focus", "Generic sourcing"],
          },
        ],
        monetizationStrategies: [
          {
            name: "Premium Subscription",
            description:
              "Higher-priced subscriptions justified by sustainability and local sourcing",
          },
        ],
        improvementSuggestions: [
          {
            title: "Start with single metropolitan area",
            description:
              "Prove the model in one city before expanding to reduce complexity",
          },
        ],
        nextSteps: [
          {
            title: "Map local supplier network",
            description:
              "Identify and evaluate potential local suppliers in target market",
          },
        ],
        finalScore: 5.6,
        finalScoreExplanation:
          "Good market positioning with strong differentiation, but significant operational challenges that could impact scalability and profitability.",
        viabilitySummary:
          "Viable in specific markets with strong local food ecosystems. Success depends on operational excellence and premium market positioning.",
      },
    },
    {
      id: "mock-analysis-003",
      userId: mockUser.id,
      idea: "Mobile app that gamifies learning programming through AR coding challenges in real-world environments",
      createdAt: new Date(
        baseDate.getTime() + 8 * 24 * 60 * 60 * 1000
      ).toISOString(), // 8 days later
      audioBase64: null,
      analysisType: "idea",
      analysis: {
        detailedSummary:
          "This AR programming education concept combines the growing demand for coding skills with innovative gamification and emerging AR technology. The real-world integration could make abstract programming concepts more tangible and engaging. However, the technical complexity and hardware requirements present significant barriers to adoption.",
        founderQuestions: [
          {
            question:
              "How will you handle the fragmentation of AR capabilities across devices?",
            ask: "What's your minimum viable AR experience that works across different smartphones?",
            why: "AR performance varies dramatically across devices, affecting user experience consistency",
            source: "AR technology assessment",
            analysis:
              "Technical limitations could severely impact user adoption and retention",
          },
        ],
        swotAnalysis: {
          strengths: [
            "Innovative approach to programming education",
            "Gamification increases engagement and retention",
            "AR technology creates immersive learning experience",
          ],
          weaknesses: [
            "High technical complexity for AR development",
            "Limited by device AR capabilities",
            "Requires significant content creation investment",
          ],
          opportunities: [
            "Growing demand for programming education",
            "AR technology becoming more mainstream",
            "Corporate training market for upskilling",
          ],
          threats: [
            "Established coding education platforms adding AR features",
            "AR technology still emerging with adoption barriers",
            "High development costs may not be sustainable",
          ],
        },
        currentMarketTrends: [
          {
            trend: "AR market expected to reach $198B by 2025",
            impact: "Growing platform for innovative educational applications",
          },
        ],
        scoringRubric: [
          {
            name: "Market Opportunity",
            score: 8,
            justification: "Large and growing market for programming education",
          },
          {
            name: "Technical Feasibility",
            score: 4,
            justification:
              "Complex AR development with device compatibility challenges",
          },
          {
            name: "Competitive Advantage",
            score: 9,
            justification:
              "Highly innovative approach with strong differentiation",
          },
          {
            name: "Revenue Potential",
            score: 7,
            justification:
              "Premium pricing possible for innovative educational tool",
          },
          {
            name: "Execution Risk",
            score: 2,
            justification:
              "Very high technical risk and development complexity",
          },
        ],
        competitors: [
          {
            name: "Codecademy",
            description: "Interactive online coding education platform",
            strengths: [
              "Established user base",
              "Comprehensive curriculum",
              "Proven business model",
            ],
            weaknesses: ["Traditional interface", "No AR/immersive features"],
          },
        ],
        monetizationStrategies: [
          {
            name: "Premium Subscription",
            description:
              "Tiered pricing for different programming languages and AR experiences",
          },
        ],
        improvementSuggestions: [
          {
            title: "Start with simple AR overlays",
            description:
              "Begin with basic AR features before building complex 3D environments",
          },
        ],
        nextSteps: [
          {
            title: "Build AR prototype",
            description:
              "Create proof-of-concept AR experience to validate technical feasibility",
          },
        ],
        finalScore: 6.0,
        finalScoreExplanation:
          "Highly innovative concept with strong market potential, but significant technical risks and execution challenges that could prevent successful implementation.",
        viabilitySummary:
          "Viable as a long-term vision but requires substantial technical validation and potentially a simpler initial approach to prove market demand.",
      },
    },
  ];

  return mockAnalyses;
}

/**
 * Generate mock hackathon analyses with different categories and scores
 */
export function generateMockHackathonAnalyses(): SavedHackathonAnalysis[] {
  const mockUser = generateMockUser();
  const baseDate = new Date("2024-10-20T00:00:00Z");

  const mockAnalyses: SavedHackathonAnalysis[] = [
    {
      id: "mock-hackathon-001",
      userId: mockUser.id,
      projectDescription:
        "AI-powered code review assistant that automatically detects bugs, suggests improvements, and learns from team coding patterns using machine learning",
      createdAt: new Date(
        baseDate.getTime() + 1 * 24 * 60 * 60 * 1000
      ).toISOString(), // 1 day later
      audioBase64: null,
      supportingMaterials: {
        screenshots: [],
        demoLink: "https://github.com/mockuser/ai-code-reviewer",
        additionalNotes:
          "Integrated with GitHub API and supports Python, JavaScript, and TypeScript analysis",
      },
      analysis: {
        detailedSummary:
          "This AI code review assistant demonstrates excellent technical execution and addresses a real developer pain point. The machine learning approach to pattern recognition shows innovation, and the VS Code integration provides practical value. The project successfully combines multiple technologies into a cohesive developer tool.",
        categoryAnalysis: {
          evaluations: [
            {
              category: "frankenstein",
              fitScore: 9,
              explanation:
                "Excellent fit for Frankenstein category - combines AI/ML, code analysis, IDE integration, and GitHub API into a unified developer tool. Shows true technological mashup spirit.",
              improvementSuggestions: [
                "Add support for more programming languages",
                "Implement team-specific customization features",
              ],
            },
            {
              category: "resurrection",
              fitScore: 4,
              explanation:
                "Limited fit - while it improves existing code, it's more about enhancement than resurrection of legacy systems.",
              improvementSuggestions: [
                "Focus on legacy code modernization features",
                "Add migration assistance capabilities",
              ],
            },
            {
              category: "skeleton-crew",
              fitScore: 6,
              explanation:
                "Moderate fit - could help small teams with automated code review when human reviewers are limited.",
              improvementSuggestions: [
                "Emphasize team productivity and resource optimization",
                "Add features for distributed team collaboration",
              ],
            },
            {
              category: "costume-contest",
              fitScore: 3,
              explanation:
                "Poor fit - this is a serious developer tool rather than a creative or aesthetic project.",
              improvementSuggestions: [
                "Add fun UI elements or gamification",
                "Create themed code review messages",
              ],
            },
          ],
          bestMatch: "frankenstein",
          bestMatchReason:
            "Perfect example of technological mashup combining AI, code analysis, and developer tools into something greater than the sum of its parts.",
        },
        criteriaAnalysis: {
          scores: [
            {
              name: "Potential Value",
              score: 4.5,
              justification:
                "High potential value for developer productivity and code quality improvement. Addresses real pain points in software development workflow.",
              subScores: {
                "Market Need": {
                  score: 5,
                  explanation:
                    "Strong demand for automated code review tools in development teams",
                },
                "User Impact": {
                  score: 4,
                  explanation:
                    "Significant time savings and quality improvements for developers",
                },
              },
            },
            {
              name: "Implementation",
              score: 4.2,
              justification:
                "Solid technical implementation with ML integration and VS Code extension. Good use of existing APIs and frameworks.",
              subScores: {
                "Technical Execution": {
                  score: 4,
                  explanation:
                    "Well-implemented ML pipeline and IDE integration",
                },
                "Code Quality": {
                  score: 4.5,
                  explanation:
                    "Clean, well-structured codebase with good documentation",
                },
              },
            },
            {
              name: "Quality and Design",
              score: 4.0,
              justification:
                "Professional interface design and smooth user experience. Could benefit from more advanced UI features.",
              subScores: {
                "User Experience": {
                  score: 4,
                  explanation:
                    "Intuitive interface that integrates well with developer workflow",
                },
                "Visual Design": {
                  score: 4,
                  explanation:
                    "Clean, functional design appropriate for developer tools",
                },
              },
            },
          ],
          finalScore: 4.2,
          finalScoreExplanation:
            "Strong overall execution with excellent technical implementation and clear value proposition. Minor improvements needed in UI sophistication and feature completeness.",
        },
        hackathonSpecificAdvice: {
          categoryOptimization: [
            "Emphasize the 'Frankenstein' nature by highlighting how you've stitched together different AI models and APIs",
            "Create a demo showing the mashup of technologies working together seamlessly",
          ],
          kiroIntegrationTips: [
            "Document specific Kiro prompts that helped with ML model development",
            "Show before/after code examples where Kiro improved your implementation",
          ],
          competitionStrategy: [
            "Focus on live demo showing real-time code analysis",
            "Prepare examples of actual bugs caught by your system",
            "Highlight the learning aspect - how the AI improves over time",
          ],
        },
        scoringRubric: [
          {
            name: "Technical Innovation",
            score: 8,
            justification:
              "Creative use of ML for code analysis with practical developer integration",
          },
          {
            name: "Execution Quality",
            score: 8,
            justification:
              "Well-implemented with good documentation and testing",
          },
          {
            name: "Market Relevance",
            score: 9,
            justification:
              "Addresses clear developer pain points with practical solution",
          },
        ],
        competitors: [
          {
            name: "SonarQube",
            description: "Static code analysis platform for code quality",
            strengths: [
              "Enterprise adoption",
              "Comprehensive analysis",
              "Multiple language support",
            ],
            weaknesses: [
              "Complex setup",
              "Limited ML capabilities",
              "Expensive licensing",
            ],
          },
        ],
        improvementSuggestions: [
          {
            title: "Add real-time collaboration features",
            description:
              "Enable team members to see and discuss AI suggestions in real-time",
          },
          {
            title: "Implement custom rule creation",
            description:
              "Allow teams to define their own coding standards and patterns",
          },
        ],
        nextSteps: [
          {
            title: "Expand language support",
            description:
              "Add support for Go, Rust, and other popular languages",
          },
          {
            title: "Build team analytics dashboard",
            description:
              "Create insights into team coding patterns and improvement trends",
          },
        ],
        finalScore: 4.2,
        finalScoreExplanation:
          "Excellent technical project with strong market relevance and solid execution. Perfect fit for Frankenstein category with its technology mashup approach.",
        viabilitySummary:
          "Highly viable as both a hackathon project and potential commercial product. Strong technical foundation with clear path to market.",
      },
    },
    {
      id: "mock-hackathon-002",
      userId: mockUser.id,
      projectDescription:
        "Spooky Halloween costume recommendation engine that uses computer vision to analyze your face shape, body type, and existing wardrobe to suggest perfect costume ideas",
      createdAt: new Date(
        baseDate.getTime() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(), // 3 days later
      audioBase64: null,
      supportingMaterials: {
        screenshots: [],
        demoLink: "https://spooky-costume-ai.vercel.app",
        additionalNotes:
          "Includes AR try-on feature and integration with costume rental services",
      },
      analysis: {
        detailedSummary:
          "This Halloween costume recommendation engine showcases creative use of computer vision technology for a fun, seasonal application. The combination of facial analysis, body type detection, and wardrobe integration creates a comprehensive solution for costume selection. The AR try-on feature adds significant user engagement value.",
        categoryAnalysis: {
          evaluations: [
            {
              category: "costume-contest",
              fitScore: 10,
              explanation:
                "Perfect fit for Costume Contest category - literally about costumes! Creative, fun, and perfectly themed for Halloween with practical utility.",
              improvementSuggestions: [
                "Add social sharing features for costume reveals",
                "Implement group costume coordination features",
              ],
            },
            {
              category: "frankenstein",
              fitScore: 7,
              explanation:
                "Good fit - combines computer vision, recommendation algorithms, AR technology, and e-commerce integration into a unified experience.",
              improvementSuggestions: [
                "Emphasize the technical mashup of different AI technologies",
                "Highlight the integration of multiple APIs and services",
              ],
            },
            {
              category: "resurrection",
              fitScore: 5,
              explanation:
                "Moderate fit - could be positioned as bringing old costume ideas back to life with modern technology.",
              improvementSuggestions: [
                "Add vintage/retro costume categories",
                "Include historical costume recommendations",
              ],
            },
            {
              category: "skeleton-crew",
              fitScore: 4,
              explanation:
                "Limited fit - while it helps with costume planning, doesn't strongly relate to minimal resources theme.",
              improvementSuggestions: [
                "Focus on budget-friendly costume options",
                "Add DIY costume creation guides",
              ],
            },
          ],
          bestMatch: "costume-contest",
          bestMatchReason:
            "Directly addresses costume selection with creative technology application, perfect Halloween theming, and high entertainment value.",
        },
        criteriaAnalysis: {
          scores: [
            {
              name: "Potential Value",
              score: 3.8,
              justification:
                "High entertainment value and seasonal relevance, but limited long-term market potential due to seasonal nature.",
              subScores: {
                "Market Need": {
                  score: 3,
                  explanation:
                    "Seasonal demand with limited year-round applicability",
                },
                "User Impact": {
                  score: 4.5,
                  explanation:
                    "High user engagement and entertainment value during Halloween season",
                },
              },
            },
            {
              name: "Implementation",
              score: 4.3,
              justification:
                "Impressive technical implementation with computer vision, AR integration, and smooth mobile experience.",
              subScores: {
                "Technical Execution": {
                  score: 4.5,
                  explanation: "Advanced computer vision and AR implementation",
                },
                "Code Quality": {
                  score: 4,
                  explanation:
                    "Well-structured mobile app with good performance",
                },
              },
            },
            {
              name: "Quality and Design",
              score: 4.7,
              justification:
                "Excellent user experience with fun, engaging interface and smooth AR interactions. Great attention to Halloween theming.",
              subScores: {
                "User Experience": {
                  score: 5,
                  explanation:
                    "Intuitive, fun interface with excellent Halloween theming",
                },
                "Visual Design": {
                  score: 4.5,
                  explanation:
                    "Polished, spooky design that enhances the Halloween experience",
                },
              },
            },
          ],
          finalScore: 4.3,
          finalScoreExplanation:
            "Excellent execution with impressive technical features and outstanding user experience. Limited by seasonal market constraints but perfect for hackathon context.",
        },
        hackathonSpecificAdvice: {
          categoryOptimization: [
            "Play up the Halloween theme with spooky animations and sound effects",
            "Create a live demo with judges trying on different costume recommendations",
            "Show the social sharing features and community aspects",
          ],
          kiroIntegrationTips: [
            "Demonstrate how Kiro helped optimize the computer vision algorithms",
            "Show examples of Kiro-generated costume recommendation logic",
            "Highlight Kiro's role in creating the AR experience",
          ],
          competitionStrategy: [
            "Focus on the fun factor and audience engagement",
            "Prepare interactive demo where judges can try the app",
            "Emphasize the technical sophistication behind the playful interface",
            "Show real costume rental integration and practical utility",
          ],
        },
        scoringRubric: [
          {
            name: "Creativity and Innovation",
            score: 9,
            justification:
              "Highly creative application of advanced technology for entertainment",
          },
          {
            name: "Technical Execution",
            score: 8,
            justification: "Impressive computer vision and AR implementation",
          },
          {
            name: "User Experience",
            score: 9,
            justification:
              "Exceptional fun factor and engaging interface design",
          },
        ],
        competitors: [
          {
            name: "Pinterest Halloween Ideas",
            description: "Social platform with costume inspiration boards",
            strengths: [
              "Large user base",
              "Extensive content",
              "Social features",
            ],
            weaknesses: [
              "No personalization",
              "No AR features",
              "Manual browsing required",
            ],
          },
        ],
        improvementSuggestions: [
          {
            title: "Expand beyond Halloween",
            description:
              "Add support for other costume events like cosplay, theater, and themed parties",
          },
          {
            title: "Add social features",
            description:
              "Enable users to share costume photos and rate recommendations",
          },
        ],
        nextSteps: [
          {
            title: "Partner with costume retailers",
            description:
              "Establish partnerships with major costume rental and retail companies",
          },
          {
            title: "Expand AR capabilities",
            description:
              "Add full-body AR try-on and makeup simulation features",
          },
        ],
        finalScore: 4.3,
        finalScoreExplanation:
          "Outstanding hackathon project with excellent technical execution, perfect category fit, and high entertainment value. Limited commercial potential due to seasonal nature but perfect for competition context.",
        viabilitySummary:
          "Excellent hackathon project with strong technical merit and perfect Halloween theming. Commercial viability limited by seasonal nature but could expand to broader costume/fashion tech market.",
      },
    },
  ];

  return mockAnalyses;
}

/**
 * Generate mock ideas for the new ideas system
 */
export function generateMockIdeas(): Array<{
  id: string;
  ideaText: string;
  source: string;
  projectStatus: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}> {
  const baseDate = new Date("2024-10-15T00:00:00Z");

  return [
    {
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      ideaText:
        "AI-powered personal fitness coach that creates custom workout plans based on your body type, goals, and available equipment",
      source: "manual",
      projectStatus: "in_progress",
      documentCount: 1,
      createdAt: new Date(
        baseDate.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["fitness", "ai", "health", "mobile-app"],
    },
    {
      id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      ideaText:
        "Subscription service for locally-sourced, seasonal meal kits with zero-waste packaging",
      source: "manual",
      projectStatus: "idea",
      documentCount: 1,
      createdAt: new Date(
        baseDate.getTime() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["sustainability", "food", "subscription", "local"],
    },
    {
      id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      ideaText:
        "Mobile app that gamifies learning programming through AR coding challenges in real-world environments",
      source: "manual",
      projectStatus: "idea",
      documentCount: 1,
      createdAt: new Date(
        baseDate.getTime() + 8 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 8 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["education", "ar", "programming", "gamification"],
    },
    {
      id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      ideaText:
        "Platform that combines AI code review with GitHub integration and team learning patterns",
      source: "frankenstein",
      projectStatus: "completed",
      documentCount: 2,
      createdAt: new Date(
        baseDate.getTime() + 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 15 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["developer-tools", "ai", "code-review", "github"],
    },
    {
      id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
      ideaText:
        "Halloween costume recommendation engine using computer vision and AR try-on features",
      source: "frankenstein",
      projectStatus: "archived",
      documentCount: 1,
      createdAt: new Date(
        baseDate.getTime() + 12 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 20 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["halloween", "ar", "fashion", "computer-vision"],
    },
  ];
}

/**
 * Generate mock idea panel data (idea with documents)
 */
export function generateMockIdeaPanel(ideaId: string) {
  const mockIdeas = generateMockIdeas();
  const idea = mockIdeas.find((i) => i.id === ideaId);

  if (!idea) {
    return null;
  }

  const mockUser = generateMockUser();
  const baseDate = new Date(idea.createdAt);

  // Generate mock documents based on the idea
  const documents = [];

  // Add startup analysis document for most ideas
  if (idea.documentCount >= 1 && idea.source === "manual") {
    documents.push({
      id: `doc-${ideaId.substring(0, 8)}-001`,
      ideaId: idea.id,
      userId: mockUser.id,
      documentType: "startup_analysis",
      title: "Startup Analysis",
      content: {
        finalScore: Math.floor(Math.random() * 30) + 60, // 60-90
        viabilitySummary: `This idea shows strong potential in the market. ${idea.ideaText.substring(
          0,
          100
        )}...`,
        scoringRubric: [
          {
            name: "Market Demand",
            score: Math.floor(Math.random() * 2) + 4,
            justification: "Strong market demand with clear user need",
          },
          {
            name: "Uniqueness",
            score: Math.floor(Math.random() * 2) + 3,
            justification: "Differentiated approach with unique features",
          },
        ],
      },
      createdAt: new Date(
        baseDate.getTime() + 1 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 1 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  // Add hackathon analysis for frankenstein ideas
  if (idea.source === "frankenstein") {
    documents.push({
      id: `doc-${ideaId.substring(0, 8)}-002`,
      ideaId: idea.id,
      userId: mockUser.id,
      documentType: "hackathon_analysis",
      title: "Hackathon Analysis",
      content: {
        overallScore: Math.floor(Math.random() * 20) + 70, // 70-90
        categoryScores: {
          technical: Math.floor(Math.random() * 2) + 4,
          creativity: Math.floor(Math.random() * 2) + 4,
          impact: Math.floor(Math.random() * 2) + 3,
        },
        detailedSummary: `Excellent hackathon project with strong technical execution. ${idea.ideaText.substring(
          0,
          100
        )}...`,
      },
      createdAt: new Date(
        baseDate.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date(
        baseDate.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  return {
    idea: {
      id: idea.id,
      userId: mockUser.id,
      ideaText: idea.ideaText,
      source: idea.source,
      projectStatus: idea.projectStatus,
      notes: "",
      tags: idea.tags,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    },
    documents,
  };
}

/**
 * Initialize local storage with mock data if empty
 */
export async function initializeMockData(): Promise<void> {
  const { localStorageService } = await import("./localStorage");

  try {
    // Check if data already exists
    const existingAnalyses = await localStorageService.loadAnalyses();
    const existingHackathonAnalyses =
      await localStorageService.loadHackathonAnalyses();

    // Only initialize if no data exists
    if (existingAnalyses.length === 0) {
      const mockAnalyses = generateMockStartupAnalyses();
      for (const analysis of mockAnalyses) {
        await localStorageService.saveAnalysis(analysis);
      }
      console.log("Initialized mock startup analyses for local development");
    }

    if (existingHackathonAnalyses.length === 0) {
      const mockHackathonAnalyses = generateMockHackathonAnalyses();
      for (const analysis of mockHackathonAnalyses) {
        await localStorageService.saveHackathonAnalysis(analysis);
      }
      console.log("Initialized mock hackathon analyses for local development");
    }
  } catch (error) {
    console.error("Failed to initialize mock data:", error);
    // Don't throw - this is not critical for app functionality
  }
}

/**
 * Clear all mock data from local storage
 */
export async function clearMockData(): Promise<void> {
  const { localStorageService } = await import("./localStorage");
  await localStorageService.clearAllAnalyses();
  console.log("Cleared all mock data from local storage");
}

/**
 * Get mock data statistics
 */
export function getMockDataStats() {
  const startupAnalyses = generateMockStartupAnalyses();
  const hackathonAnalyses = generateMockHackathonAnalyses();

  return {
    startupAnalysesCount: startupAnalyses.length,
    hackathonAnalysesCount: hackathonAnalyses.length,
    totalAnalyses: startupAnalyses.length + hackathonAnalyses.length,
    scoreRange: {
      min: Math.min(
        ...startupAnalyses.map((a) => a.analysis.finalScore),
        ...hackathonAnalyses.map((a) => a.analysis.finalScore)
      ),
      max: Math.max(
        ...startupAnalyses.map((a) => a.analysis.finalScore),
        ...hackathonAnalyses.map((a) => a.analysis.finalScore)
      ),
    },
    categories: hackathonAnalyses.map(
      (a) => a.analysis.categoryAnalysis.bestMatch
    ),
    mockUser: generateMockUser(),
  };
}
