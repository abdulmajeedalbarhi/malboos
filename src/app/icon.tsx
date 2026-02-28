import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
                    fontSize: 320,
                    fontWeight: "bold",
                    borderRadius: "20%",
                }}
            >
                M
            </div>
        ),
        { ...size }
    );
}
