import { NextRequest } from 'next/server';
import { getControllers, withApplicationBootstrap } from '@/src/infrastructure/bootstrap/nextjs';

export const runtime = 'nodejs';

// GET handler for retrieving a specific analysis
export const GET = withApplicationBootstrap(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.getAnalysis(request, { params });
  }
);

// PUT handler for updating a specific analysis
export const PUT = withApplicationBootstrap(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.updateAnalysis(request, { params });
  }
);

// DELETE handler for deleting a specific analysis
export const DELETE = withApplicationBootstrap(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { analysisController } = await getControllers();
    return analysisController.deleteAnalysis(request, { params });
  }
);