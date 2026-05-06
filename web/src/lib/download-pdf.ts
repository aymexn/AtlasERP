/**
 * ROBUST BLOB-BASED PDF DOWNLOAD UTILITY
 * Securely downloads PDFs using fetch + blob to passing JWT authentication
 * without exposing tokens in the URL.
 */

import { API_URL } from './api';

export async function downloadPdf(url: string, filename: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('atlas_token') : null;
    
    // Ensure relative URLs hit the correct server
    let targetUrl = url;
    if (url.startsWith('/api/')) {
        targetUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
    } else if (url.startsWith('/')) {
        targetUrl = `${API_URL}${url}`;
    }
    
    try {
        console.log('Downloading PDF from:', targetUrl);
        const response = await fetch(targetUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`PDF Download API returned ${response.status}: ${response.statusText}`);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        // Final validation that we received a PDF
        if (blob.type !== 'application/pdf') {
            if (blob.size < 500) {
               const text = await blob.text();
               console.error('Expected PDF but received:', text);
               throw new Error('Invalid PDF format received from server');
            }
        }

        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            window.URL.revokeObjectURL(blobUrl);
        }, 300);

        return true;
        
    } catch (error: any) {
        console.error('PDF Download Error:', error);
        throw error;
    }
}
