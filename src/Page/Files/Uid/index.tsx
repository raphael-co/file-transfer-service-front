import React, { useState, useEffect, createContext } from 'react';
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
    const navigate = useNavigate();

    useEffect(() => {
        if (uid) {
            axios.get(`http://localhost:3000/api/files/${uid}`)
                .then(response => {
                    setData(response.data.files);
                    setTotalSize(response.data.totalSize);
                    setNumberOfFiles(response.data.numberOfFiles);
                })
                .catch(error => {
                    console.error('Error fetching file data:', error);
                    navigate(`/files?message=${error.response.data.message}&uid=${uid}`);
                });
        }
    }, [uid, navigate]);

    const toggleNode = (path: string) => {
        setOpenNodes(prevState => ({
            ...prevState,
            [path]: !prevState[path],
        }));
    };

    const setAllNodes = (nodes: FileSystemEntry[], open: boolean, path: string = '') => {
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
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/files/download/${uid}`, {
                responseType: 'blob', // Important pour les fichiers
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${uid}.zip`); // Nom du fichier à télécharger
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <FileTreeContext.Provider value={{ openNodes, toggleNode, setAllNodes: (open) => setAllNodes(data, open) }}>
            <div className="app-download">
                <div className='uid-tab-buttons'>
                    <div className='ui-tab-container-buttons-right'>
                        <button className='uid-tab active' onClick={() => setAllNodes(data, true)}>Open All</button>
                        <button className='uid-tab active' onClick={() => setAllNodes(data, false)}>Close All</button>
                    </div>
                    <div className='ui-tab-container-buttons-left'>
                        <button className='uid-tab active' onClick={handleDownload}>Download</button>
                    </div>
                </div>
                <div className='uid-tab-buttons' style={{ padding: 0 }}>
                    <div className='ui-tab-container-buttons-right' style={{ padding: '0 15px' }}>
                        number of files : {numberOfFiles}
                    </div>
                    <div className='ui-tab-container-buttons-left' style={{ padding: '0 15px' }}>
                        size : {totalSize}
                    </div>
                </div>
                <div className="file-tree-container">
                    {data.map((node, index) => (
                        <FileNode key={index} node={node} path={`${node.name}`} />
                    ))}
                </div>
            </div>
        </FileTreeContext.Provider>
    );
};

export default FileTree;
export { FileTreeContext };