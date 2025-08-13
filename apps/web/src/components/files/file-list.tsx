"use client";

type TFile = {
  id: string;
  ext: string;
  mime: string;
  filename: string;
  size: number;
  ownerId: string;
  key: string;
  createdAt: string;
};

type TFileListProps = {
  userId: string;
};

export default function FileList(props: TFileListProps) {
  const { userId } = props;
  return <>file list</>;
}
