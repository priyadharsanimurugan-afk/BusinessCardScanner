import React, { useState } from "react";
import axios from "axios";

// 🔥 Your HuggingFace endpoint
const API_URL = "https://priyachithara-scanner.hf.space/api/predict";


// ---------------- TYPES ----------------

type OCRData = {
  "👤 Name"?: string;
  "💼 Designation"?: string;
  "🏢 Company"?: string;
  "🏬 Sub Company"?: string;
  "📞 Phones"?: string[];
  "📧 Emails"?: string[];
  "🌐 Websites"?: string[];
  "📍 Address"?: string;
  "🛠 Services"?: string[];
};

// ---------------- MAIN APP ----------------

export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [data, setData] = useState<OCRData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 📤 Handle upload
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setText("");
    setData(null);
  };

  // 🔁 Convert to base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  // 🚀 API call
const extract = async () => {
  if (!image) {
    alert("Upload image first");
    return;
  }

  setLoading(true);

  try {
    const base64 = await toBase64(image);

    // STEP 1: trigger prediction
    const res = await axios.post(
      "https://priyachithara-scanner.hf.space/gradio_api/call/predict",
      {
        data: [base64],
      }
    );

    const eventId = res.data.event_id;

    let finalData = null;

    // STEP 2: poll until complete
    while (true) {
      const poll = await axios.get(
        `https://priyachithara-scanner.hf.space/gradio_api/call/predict/${eventId}`
      );

      console.log("Polling:", poll.data);

      if (poll.data?.event === "complete") {
        finalData = poll.data.data;
        break;
      }

      if (poll.data?.event === "error") {
        throw new Error("Gradio processing failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    // STEP 3: set result
    setText(finalData?.[0] || "");
    setData(finalData?.[1] || {});
  } catch (err) {
    console.error(err);
    alert("❌ API failed");
  }

  setLoading(false);
};





  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📇 Business Card Scanner</h1>

      <input type="file" accept="image/*" onChange={handleImage} />

      {preview && <img src={preview} alt="preview" style={styles.image} />}

      <button onClick={extract} style={styles.button} disabled={loading}>
        {loading ? "⏳ Processing..." : "🔍 Extract"}
      </button>

      {/* TEXT OUTPUT */}
      {text && (
        <div style={styles.card}>
          <h3>📝 Extracted Text</h3>
          <pre style={styles.pre}>{text}</pre>
        </div>
      )}

      {/* STRUCTURED DATA */}
      {data && (
        <div style={styles.card}>
          <h3>📌 Structured Data</h3>

          <Info label="Name" value={data["👤 Name"]} />
          <Info label="Designation" value={data["💼 Designation"]} />
          <Info label="Company" value={data["🏢 Company"]} />
          <Info label="Sub Company" value={data["🏬 Sub Company"]} />

          <InfoList label="Phones" list={data["📞 Phones"]} />
          <InfoList label="Emails" list={data["📧 Emails"]} />
          <InfoList label="Websites" list={data["🌐 Websites"]} />

          <Info label="Address" value={data["📍 Address"]} />

          {data["🛠 Services"] && (
            <div>
              <b>Services:</b>
              <ul>
                {data["🛠 Services"]?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- REUSABLE COMPONENTS ----------------

type InfoProps = {
  label: string;
  value?: string;
};

const Info: React.FC<InfoProps> = ({ label, value }) =>
  value ? (
    <p>
      <b>{label}:</b> {value}
    </p>
  ) : null;

type InfoListProps = {
  label: string;
  list?: string[];
};

const InfoList: React.FC<InfoListProps> = ({ label, list }) =>
  list && list.length > 0 ? (
    <p>
      <b>{label}:</b> {list.join(", ")}
    </p>
  ) : null;

// ---------------- STYLES ----------------

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 600,
    margin: "auto",
    padding: 20,
    fontFamily: "Segoe UI",
  },
  title: {
    textAlign: "center" as const,
  },
  image: {
    width: "100%",
    marginTop: 10,
    borderRadius: 10,
  },
  button: {
    marginTop: 15,
    padding: 12,
    width: "100%",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
  },
  card: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    background: "#f9f9f9",
    border: "1px solid #ddd",
  },
  pre: {
    whiteSpace: "pre-wrap",
  },
};
