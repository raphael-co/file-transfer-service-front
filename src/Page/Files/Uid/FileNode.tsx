import React, { useContext } from 'react';
import { FileTreeContext } from './';

interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  size?: string;
  children?: FileSystemEntry[];
}

interface FileNodeProps {
  node: FileSystemEntry;
  path: string;
}

const FileNode: React.FC<FileNodeProps> = ({ node, path }) => {
  const { openNodes, toggleNode } = useContext(FileTreeContext);
  const isOpen = openNodes[path] ?? false;

  const toggleOpen = () => {
    toggleNode(path);
  };

  return (
    <div className="file-node">
      {node.type === 'directory' ? (
        <>
          <div className="folder" onClick={toggleOpen}>
            {isOpen ? '📂' : '📁'} {node.name}
          </div>
          {isOpen && node.children && (
            <div className="children">
              {node.children.map((child, index) => (
                <FileNode key={index} node={child} path={`${path}/${child.name}`} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="file">
          📄 {node.name} ({node.size})
        </div>
      )}
    </div>
  );
};

export default FileNode;
