import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoData = fs.readFileSync(logoPath);
    const base64Image = `data:image/png;base64,${logoData.toString("base64")}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "20%",
                    overflow: "hidden",
                    backgroundColor: "white",
                }}
            >
                <img src={base64Image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
        ),
        { ...size }
    );
}
