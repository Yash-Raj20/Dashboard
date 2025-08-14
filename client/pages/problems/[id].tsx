"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { fetchApi } from "@shared/api";
import { Problem } from "../AllProblems";

export default function ProblemDetails({ params }: { params: { _id: string } }) {
  const { _id } = params;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<Problem>(`problems/${_id}`);
        setProblem(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load problem");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [_id]);

  if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>;
  if (error) return <DashboardLayout><p>{error}</p></DashboardLayout>;
  if (!problem) return <DashboardLayout><p>Problem not found</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        {problem.image && (
          <img
            src={problem.image}
            alt={problem.title}
            className="w-full max-w-md rounded-md"
          />
        )}
        <p><strong>Description:</strong> {problem.description}</p>
        <p><strong>Category:</strong> {problem.category}</p>
        <p><strong>Urgency:</strong> {problem.urgency}</p>
        <p><strong>Location:</strong> {problem.location}, {problem.district}, {problem.state}</p>
        <p><strong>Contact:</strong> {problem.contact}</p>
        <p><strong>Status:</strong> {problem.status}</p>
        <p><strong>Created:</strong> {new Date(problem.createdAt).toLocaleString()}</p>
      </div>
    </DashboardLayout>
  );
}