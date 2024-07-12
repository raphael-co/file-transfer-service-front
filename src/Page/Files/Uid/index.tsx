import React, { useState, useEffect, createContext, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './FileTree.css';
import FileNode from './FileNode';

interface FileSystemEntry {
    name: string;
    type: 'file' | 'directory';
    size?: string;
    children?: FileSystemEntry[];
}

interface FileTreeContextType {
    openNodes: Record<string, boolean>;
    toggleNode: (path: string) => void;
    setAllNodes: (open: boolean) => void;
}

const FileTreeContext = createContext<FileTreeContextType>({
    openNodes: {},
    toggleNode: () => { },
    setAllNodes: () => { },
});

const FileTree: React.FC = () => {
    const { uid } = useParams<{ uid: string }>();
    const [data, setData] = useState<FileSystemEntry[] | null>(null);
    const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
    const [totalSize, setTotalSize] = useState('0');
    const [numberOfFiles, setNumberOfFiles] = useState('0');
    const [loading, setLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [triggerOpenAll, setTriggerOpenAll] = useState(false);
    const [triggerCloseAll, setTriggerCloseAll] = useState(false);
    const [displayedFilesCount, setDisplayedFilesCount] = useState(0);
    const [showScrollToTop, setShowScrollToTop] = useState(false); // État pour afficher/masquer le bouton
    const navigate = useNavigate();
    const tabButtonsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (uid) {
            axios.get(`${process.env.REACT_APP_API_URL}/api/files/${uid}`)
                .then(response => {
                    setData(response.data.files);
                    setTotalSize(response.data.totalSize);
                    setNumberOfFiles(response.data.numberOfFiles);
                })
                .catch(error => {
                    console.error('Error fetching file data:', error);
                    navigate(`/file?message=${error.response.data.message}&uid=${uid}`);
                });
        }
    }, [uid, navigate]);

    const setAllNodes = useCallback((nodes: FileSystemEntry[], open: boolean, path: string = '') => {
        setLoading(true);
        const newOpenNodes: Record<string, boolean> = {};
        const setAll = (nodes: FileSystemEntry[], path: string) => {
            nodes.forEach((node) => {
                const currentPath = path ? `${path}/${node.name}` : node.name;
                if (node.type === 'directory') {
                    newOpenNodes[currentPath] = open;
                    if (node.children) {
                        setAll(node.children, currentPath);
                    }
                }
            });
        };
        setAll(nodes, path);
        setOpenNodes(newOpenNodes);
    }, []);

    useEffect(() => {
        if (triggerOpenAll && data) {
            setAllNodes(data, true);
            setTriggerOpenAll(false);
            setLoading(false);
        }
    }, [triggerOpenAll, data, setAllNodes]);

    useEffect(() => {
        if (triggerCloseAll && data) {
            setAllNodes(data, false);
            setTriggerCloseAll(false);
            setLoading(false);
        }
    }, [triggerCloseAll, data, setAllNodes]);

    useEffect(() => {
        if (!loading) {
            setLoading(false);
        }
    }, [loading, openNodes]);

    const deepCopyNodes = useCallback((nodes: FileSystemEntry[]): FileSystemEntry[] => {
        return nodes.map(node => ({
            ...node,
            children: node.children ? deepCopyNodes(node.children) : undefined,
        }));
    }, []);

    const filterNodes = useCallback((nodes: FileSystemEntry[], term: string): FileSystemEntry[] => {
        const lowerCaseTerm = term.toLowerCase();

        const filteredNodes = nodes.filter(node => {
            const isMatch = node.name.toLowerCase().includes(lowerCaseTerm);

            if (node.type === 'directory' && node.children) {
                node.children = filterNodes(node.children, term);
            }

            return isMatch || (node.type === 'directory' && node.children && node.children.length > 0);
        });

        return filteredNodes;
    }, []);

    const countDisplayedFiles = useCallback((nodes: FileSystemEntry[]): number => {
        let count = 0;
        const countFiles = (nodes: FileSystemEntry[]) => {
            nodes.forEach((node) => {
                if (node.type === 'file') {
                    count += 1;
                }
                if (node.type === 'directory' && node.children) {
                    countFiles(node.children);
                }
            });
        };
        countFiles(nodes);
        return count;
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 3) {
            const filtered = filterNodes(deepCopyNodes(data ?? []), searchTerm);
            setDisplayedFilesCount(countDisplayedFiles(filtered));
        } else {
            setDisplayedFilesCount(countDisplayedFiles(data ?? []));
        }
    }, [searchTerm, data, deepCopyNodes, filterNodes, countDisplayedFiles]);

    useEffect(() => {
        const handleScroll = () => {
            if (tabButtonsRef.current) {
                if (window.scrollY > tabButtonsRef.current.offsetTop) {
                    tabButtonsRef.current.classList.add('sticky');
                    setShowScrollToTop(true); // Afficher le bouton lorsque sticky est ajouté
                } else {
                    tabButtonsRef.current.classList.remove('sticky');
                    setShowScrollToTop(false); // Masquer le bouton lorsque sticky est retiré
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleNode = (path: string) => {
        setLoading(true);
        setOpenNodes(prevState => {
            const newState = { ...prevState, [path]: !prevState[path] };
            return newState;
        });
        setLoading(false);
    };

    const handleDownload = async () => {
        setLoading(true);
        setDownloadProgress(0); // Réinitialisez la progression à 0
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${process.env.REACT_APP_API_URL}/api/files/download/${uid}`, true);
            xhr.responseType = 'blob';

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const currentProgress = Math.round((event.loaded * 100) / event.total);
                    setDownloadProgress(currentProgress);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const url = window.URL.createObjectURL(new Blob([xhr.response]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${uid}.zip`); // Nom du fichier à télécharger
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                setLoading(false);
            };

            xhr.onerror = () => {
                console.error('Error downloading file');
                setLoading(false);
            };

            xhr.send();
        } catch (error) {
            console.error('Error downloading file:', error);
            setLoading(false);
        }
    };

    const filteredData = searchTerm.length >= 3 ? filterNodes(deepCopyNodes(data ?? []), searchTerm) : data;

    if (!data) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <FileTreeContext.Provider value={{ openNodes, toggleNode, setAllNodes: (open) => setAllNodes(data, open) }}>
            <div className="app-download">
                <div className='uid-tab-buttons' ref={tabButtonsRef}>
                    <div className='ui-tab-container-buttons-right'>
                        <button className='uid-tab active' onClick={() => { setLoading(true); setTriggerOpenAll(true); }}>Open All</button>
                        <button className='uid-tab active' onClick={() => { setLoading(true); setTriggerCloseAll(true); }}>Close All</button>
                    </div>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className='ui-tab-container-buttons-left'>
                        <button className='uid-tab active' onClick={handleDownload}>Download</button>
                    </div>
                </div>
                <div className='uid-tab-buttons' style={{ padding: 0 }}>
                    <div className='ui-tab-container-buttons-right' style={{ padding: '0 15px' }}>
                        number of files : {numberOfFiles} | displayed: {displayedFilesCount}
                    </div>
                    <div className='ui-tab-container-buttons-left' style={{ padding: '0 15px' }}>
                        size : {totalSize}
                    </div>
                </div>
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <p>{downloadProgress > 0 ? `Download ${downloadProgress}%` : 'Loading...'}</p>
                    </div>
                )}
                <div className="file-tree-container">
                    {filteredData?.map((node, index) => (
                        <FileNode key={index} node={node} path={`${node.name}`} />
                    ))}
                </div>
                {showScrollToTop && (
                    <button className="scroll-to-top" onClick={scrollToTop}>
                        ↑
                    </button>
                )}
            </div>
        </FileTreeContext.Provider>
    );
};

export default FileTree;
export { FileTreeContext };
