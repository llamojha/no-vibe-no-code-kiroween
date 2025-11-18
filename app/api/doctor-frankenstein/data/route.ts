import { NextResponse } from "next/server";
import type {
  TechCompany,
  AWSService,
} from "@/features/doctor-frankenstein/utils/dataParser";
import techCompaniesData from "./tech-companies.json";
import awsServicesData from "./aws-services.json";

export const dynamic = "force-static";
export const revalidate = 3600; // Cache for 1 hour

interface DataResponse {
  techCompanies: TechCompany[];
  awsServices: AWSService[];
}

interface JSONCategory {
  name: string;
  items: Array<{ name: string; description: string }>;
}

interface JSONData {
  categories: JSONCategory[];
}

export async function GET() {
  try {
    const companiesData = techCompaniesData as JSONData;
    const awsData = awsServicesData as JSONData;

    // Flatten categories into arrays with category field
    const techCompanies: TechCompany[] = companiesData.categories.flatMap(
      (cat) =>
        cat.items.map((item) => ({
          name: item.name,
          description: item.description,
          category: cat.name,
        }))
    );

    const awsServices: AWSService[] = awsData.categories.flatMap((cat) =>
      cat.items.map((item) => ({
        name: item.name,
        description: item.description,
        category: cat.name,
      }))
    );

    const response: DataResponse = {
      techCompanies,
      awsServices,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Failed to load Doctor Frankenstein data:", error);
    return NextResponse.json(
      {
        error: "Failed to load data sources",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
