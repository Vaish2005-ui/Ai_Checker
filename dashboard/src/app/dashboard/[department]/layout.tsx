export function generateStaticParams() {
  return [
    { department: "hr" },
    { department: "finance" },
    { department: "software" },
    { department: "engineering" },
    { department: "operations" },
    { department: "security" },
    { department: "marketing" },
  ];
}

export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
