import { describe, it, expect } from "vitest";

/**
 * Test that all API functions are properly exported
 */
describe("Idea Panel API Exports", () => {
  it("should export all required API functions", async () => {
    const apiModule = await import("../index");

    // Verify all functions are exported
    expect(apiModule.getIdeaWithDocuments).toBeDefined();
    expect(apiModule.getUserIdeas).toBeDefined();
    expect(apiModule.updateStatus).toBeDefined();
    expect(apiModule.saveMetadata).toBeDefined();
    expect(apiModule.getDocumentsByIdea).toBeDefined();

    // Verify they are functions
    expect(typeof apiModule.getIdeaWithDocuments).toBe("function");
    expect(typeof apiModule.getUserIdeas).toBe("function");
    expect(typeof apiModule.updateStatus).toBe("function");
    expect(typeof apiModule.saveMetadata).toBe("function");
    expect(typeof apiModule.getDocumentsByIdea).toBe("function");
  });
});
