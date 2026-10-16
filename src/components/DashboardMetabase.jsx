import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api";

export default function DashboardMetabase() {
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        axios.get(`${API}/metabase/embed-url`, { signal: controller.signal, skipLoader: true })
            .then(res => setUrl(res.data.url))
            .catch(err => {
                if (!axios.isCancel(err)) setError(err.response?.status ?? err.message);
            });

        return () => controller.abort();
    }, []);

    if (error) return <div className="chart-loading">No se pudo cargar el dashboard ({error})</div>;
    if (!url)  return <div className="chart-loading">Cargando dashboard...</div>;

    return (
        <iframe
            src={url}
            title="Dashboard Metabase"
            width="100%"
            height="900"
            style={{ border: "none" }}
        />
    );
}