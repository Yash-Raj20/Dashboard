"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

function HighDemandProblems() {
  const [problems, setProblems] = useState<any[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem("problems");
    if (cached) {
      const parsed = JSON.parse(cached);
      const top5 = parsed
        .filter((p: any) => Array.isArray(p.upvotes))
        .sort((a: any, b: any) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
        .slice(0, 5);
      setProblems(top5);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              🔥 High Demand Problems
            </h1>
            <p className="text-muted-foreground">
              Top 5 most voted problems submitted by users.
            </p>
          </div>
        </div>

        {/* Problems Table */}
        <Card>
          <CardContent className="p-0">
            {problems.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                No problems found. (Try opening All Problems page first)
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((problem, index) => (
                    <TableRow key={problem.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-semibold">
                        {problem.title}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {problem.description}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {problem.location}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {problem.category}
                      </TableCell> 
                      <TableCell className="max-w-md truncate">
                        {problem.status}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {problem.upvotes?.length || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default HighDemandProblems;