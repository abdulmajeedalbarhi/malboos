import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sizeParam = searchParams.get("size");
        const size = sizeParam ? parseInt(sizeParam, 10) : 512;

        return new ImageResponse(
            (
                <div
                    style={{
                        background: "linear-gradient(135deg, #d88030, #a95a1c)",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: size * 0.6,
                        fontWeight: "bold",
                        borderRadius: "20%",
                    }}
                >
                    M
                </div>
            ),
            { width: size, height: size }
        );
    } catch (e: any) {
        return new Response(`Failed to generate image`, { status: 500 });
    }
}
