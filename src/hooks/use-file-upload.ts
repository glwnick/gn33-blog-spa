import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, InputHTMLAttributes } from 'react';

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
};

export type FileWithPreview = {
  file: File | FileMetadata;
  id: string;
  preview?: string;
};

export type FileUploadOptions = {
  maxFiles?: number; // Only used when multiple is true, defaults to Infinity
  maxSize?: number; // in bytes
  accept?: string;
  multiple?: boolean; // Defaults to false
  initialFiles?: Array<FileMetadata>;
  onFilesChange?: (files: Array<FileWithPreview>) => void; // Callback when files change
  onFilesAdded?: (addedFiles: Array<FileWithPreview>) => void; // Callback when new files are added
};

export type FileUploadState = {
  files: Array<FileWithPreview>;
  isDragging: boolean;
  errors: Array<string>;
};

export type FileUploadActions = {
  addFiles: (files: FileList | Array<File>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    // Use `any` here to avoid cross-React ref type conflicts across packages
    // biome-ignore lint/suspicious/noExplicitAny: intentional
    ref: any;
  };
};

export const useFileUpload = (
  options: FileUploadOptions = {},
): [FileUploadState, FileUploadActions] => {
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    maxSize = Number.POSITIVE_INFINITY,
    accept = '*',
    multiple = false,
    initialFiles = [],
    onFilesChange,
    onFilesAdded,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    errors: [],
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url,
    })),
    isDragging: false,
  });

  // React does not guarantee that a setState(prev => ...) updater runs
  // synchronously before the code following the setState call, so callers
  // cannot rely on reading "the result" right after calling setState. This
  // ref is the synchronous source of truth: every mutator below computes the
  // next state from it directly, writes the ref immediately, then calls
  // setState with a plain value (never a function) to trigger the re-render.
  // External callbacks (onFilesAdded/onFilesChange) are only ever invoked
  // after that point, in plain sequential code - never from inside a
  // setState updater - so they can safely update other components (e.g.
  // TanStack Form's field.handleChange) without React warning about updating
  // a component while rendering a different one.
  const stateRef = useRef(state);

  const inputRef = useRef<HTMLInputElement>(null);

  const commitState = useCallback((nextState: FileUploadState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const validateFile = useCallback(
    (file: File | FileMetadata): string | null => {
      if (file instanceof File) {
        if (file.size > maxSize) {
          return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`;
        }
      } else {
        if (file.size > maxSize) {
          return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`;
        }
      }

      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const fileType = file instanceof File ? file.type || '' : file.type;
        const fileExtension = `.${file instanceof File ? file.name.split('.').pop() : file.name.split('.').pop()}`;

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith('.')) {
            return fileExtension.toLowerCase() === type.toLowerCase();
          }
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(`${baseType}/`);
          }
          return fileType === type;
        });

        if (!isAccepted) {
          return `File "${file instanceof File ? file.name : file.name}" is not an accepted file type.`;
        }
      }

      return null;
    },
    [accept, maxSize],
  );

  const createPreview = useCallback(
    (file: File | FileMetadata): string | undefined => {
      if (file instanceof File) {
        return URL.createObjectURL(file);
      }
      return file.url;
    },
    [],
  );

  const generateUniqueId = useCallback((file: File | FileMetadata): string => {
    if (file instanceof File) {
      return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return file.id;
  }, []);

  const clearFiles = useCallback(() => {
    const prev = stateRef.current;

    // Clean up object URLs
    for (const file of prev.files) {
      if (
        file.preview &&
        file.file instanceof File &&
        file.file.type.startsWith('image/')
      ) {
        URL.revokeObjectURL(file.preview);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    commitState({ ...prev, errors: [], files: [] });
    onFilesChange?.([]);
  }, [commitState, onFilesChange]);

  const addFiles = useCallback(
    (newFiles: FileList | Array<File>) => {
      if (newFiles.length === 0) return;

      const newFilesArray = Array.from(newFiles);

      if (!multiple) {
        clearFiles();
      }

      const prev = stateRef.current;
      const errors: Array<string> = [];

      if (
        multiple &&
        maxFiles !== Number.POSITIVE_INFINITY &&
        prev.files.length + newFilesArray.length > maxFiles
      ) {
        errors.push(`You can only upload a maximum of ${maxFiles} files.`);
        commitState({ ...prev, errors });
        return;
      }

      const validFiles: Array<FileWithPreview> = [];

      for (const file of newFilesArray) {
        if (multiple) {
          const isDuplicate = prev.files.some(
            (existingFile) =>
              existingFile.file.name === file.name &&
              existingFile.file.size === file.size,
          );
          if (isDuplicate) continue;
        }

        if (file.size > maxSize) {
          errors.push(
            multiple
              ? `Some files exceed the maximum size of ${formatBytes(maxSize)}.`
              : `File exceeds the maximum size of ${formatBytes(maxSize)}.`,
          );
          continue;
        }

        const error = validateFile(file);
        if (error) {
          errors.push(error);
          continue;
        }

        validFiles.push({
          file,
          id: generateUniqueId(file),
          preview: createPreview(file),
        });
      }

      if (inputRef.current) inputRef.current.value = '';

      if (validFiles.length > 0) {
        const nextFiles = !multiple
          ? validFiles
          : [...prev.files, ...validFiles];

        commitState({ ...prev, errors, files: nextFiles });
        onFilesAdded?.(validFiles);
        onFilesChange?.(nextFiles);
        return;
      }

      commitState(
        errors.length > 0 ? { ...prev, errors } : { ...prev, errors: [] },
      );
    },
    [
      maxFiles,
      multiple,
      maxSize,
      validateFile,
      createPreview,
      generateUniqueId,
      clearFiles,
      commitState,
      onFilesChange,
      onFilesAdded,
    ],
  );

  const removeFile = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      const fileToRemove = prev.files.find((file) => file.id === id);
      if (
        fileToRemove?.preview &&
        fileToRemove.file instanceof File &&
        fileToRemove.file.type.startsWith('image/')
      ) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      const newFiles = prev.files.filter((file) => file.id !== id);
      commitState({ ...prev, errors: [], files: newFiles });
      onFilesChange?.(newFiles);
    },
    [commitState, onFilesChange],
  );

  const clearErrors = useCallback(() => {
    commitState({ ...stateRef.current, errors: [] });
  }, [commitState]);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      commitState({ ...stateRef.current, isDragging: true });
    },
    [commitState],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }

      commitState({ ...stateRef.current, isDragging: false });
    },
    [commitState],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      commitState({ ...stateRef.current, isDragging: false });

      // Don't process files if the input is disabled
      if (inputRef.current?.disabled) {
        return;
      }

      if (e.dataTransfer.files.length > 0) {
        // In single file mode, only use the first file
        if (!multiple) {
          const file = e.dataTransfer.files[0];
          addFiles([file]);
        } else {
          addFiles(e.dataTransfer.files);
        }
      }
    },
    [addFiles, commitState, multiple],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        ...props,
        accept: props.accept || accept,
        multiple: props.multiple !== undefined ? props.multiple : multiple,
        onChange: handleFileChange,
        // Cast to `any` to prevent mismatched React ref type errors across workspaces
        // biome-ignore lint/suspicious/noExplicitAny: Intentional
        ref: inputRef as any,
        type: 'file' as const,
      };
    },
    [accept, multiple, handleFileChange],
  );

  return [
    state,
    {
      addFiles,
      clearErrors,
      clearFiles,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      removeFile,
    },
  ];
};

// Helper function to format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};
