import { NextResponse } from "next/server";
import { generateSearchQuery } from "@/lib/ai/generate-search-query";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Texto de busca é obrigatório" },
        { status: 400 }
      );
    }

    const output = await generateSearchQuery(text);

    return NextResponse.json(output);
  } catch (error) {
    console.error("Erro na API de busca:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a busca" },
      { status: 500 }
    );
  }
}
