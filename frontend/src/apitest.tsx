import { useEffect, useState } from 'react';
import { api } from './lib/api';

export default function ApiTest() {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAPI = async () => {
            try {
                const response = await api.get('/health');

                console.log('API BASE URL:', response.config.baseURL);
                console.log('API REQUEST URL:', response.config.url);
                console.log('HTTP STATUS:', response.status);
                console.log('API RESPONSE:', response.data);

                if (typeof response.data !== 'object' || response.data === null) {
                    throw new Error('Response bukan JSON: ' + JSON.stringify(response.data))
                }
                setData(response.data)
            } catch (err) {
                console.error('API ERROR:', err);

                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Terjadi kesalahan saat menghubungkan API');
                }
            } finally {
                setLoading(false);
            }
        };

        checkAPI();
    }, []);

    if (loading) return <p>Menghubungkan API...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Koneksi Test</h1>

            <h3>Raw API Response:</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}