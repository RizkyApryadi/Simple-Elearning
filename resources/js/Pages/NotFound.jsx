import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export default function NotFound() {
    useDocumentTitle('Halaman tidak ditemukan');
    const { user } = useAuth();

    return (
        <div className="fullpage">
            <div className="empty" style={{ border: 0 }}>
                <h1>Halaman tidak ditemukan</h1>
                <p>Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
                <Link className="btn" to={homeFor(user)}>
                    {user ? 'Kembali ke beranda' : 'Ke halaman masuk'}
                </Link>
            </div>
        </div>
    );
}
