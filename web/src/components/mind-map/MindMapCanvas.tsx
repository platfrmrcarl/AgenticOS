"use client";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { SkillNode } from "./SkillNode";
import { DomainNode } from "./DomainNode";
import type { Skill, Domain } from "@prisma/client";

const nodeTypes = { skill: SkillNode, domain: DomainNode };

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface MindMapCanvasProps {
  skills: SkillWithDomain[];
  domains: Domain[];
  userName: string;
}

export function MindMapCanvas({ skills, domains, userName }: MindMapCanvasProps) {
  const nodes = buildNodes(skills, domains, userName);
  const edges = buildEdges(skills, domains);

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#1f2937" gap={20} />
        <Controls className="[&>button]:bg-card [&>button]:border-border [&>button]:text-muted-foreground" />
        <MiniMap
          nodeColor="#374151"
          maskColor="rgba(10,10,10,0.8)"
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  );
}

function buildNodes(skills: SkillWithDomain[], domains: Domain[], userName: string): Node[] {
  const nodes = [];
  const centerX = 400;
  const centerY = 300;

  nodes.push({
    id: "root",
    type: "default",
    position: { x: centerX - 80, y: centerY - 20 },
    data: { label: userName },
    style: { background: "#111", border: "2px solid #f97316", color: "#fff", borderRadius: "50%", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" },
  });

  nodes.push({
    id: "claude-code",
    type: "default",
    position: { x: centerX + 60, y: centerY - 20 },
    data: { label: "CLAUDE CODE" },
    style: { background: "#0a0a0a", border: "2px solid #f97316", color: "#f97316", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: "bold", boxShadow: "0 0 20px rgba(249,115,22,0.3)" },
  });

  domains.forEach((domain, i) => {
    const angle = (i / domains.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 220;
    const x = centerX + 100 + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const domainSkills = skills.filter((s) => s.domainId === domain.id);
    nodes.push({
      id: `domain-${domain.id}`,
      type: "domain",
      position: { x, y },
      data: { label: domain.name, index: i, skillCount: domainSkills.length },
    });

    domainSkills.forEach((skill, j) => {
      const skillAngle = angle + ((j - (domainSkills.length - 1) / 2) * 0.4);
      const skillRadius = 380;
      nodes.push({
        id: `skill-${skill.id}`,
        type: "skill",
        position: { x: centerX + 100 + Math.cos(skillAngle) * skillRadius, y: centerY + Math.sin(skillAngle) * skillRadius },
        data: { label: skill.name, frequency: skill.frequency, description: skill.description },
      });
    });
  });

  return nodes;
}

function buildEdges(skills: SkillWithDomain[], domains: Domain[]): Edge[] {
  const edges = [];
  edges.push({ id: "root-cc", source: "root", target: "claude-code", style: { stroke: "#f97316", strokeWidth: 2 } });
  domains.forEach((domain) => {
    edges.push({ id: `cc-${domain.id}`, source: "claude-code", target: `domain-${domain.id}`, style: { stroke: "#374151", strokeWidth: 1.5 } });
    skills.filter((s) => s.domainId === domain.id).forEach((skill) => {
      edges.push({ id: `dom-${skill.id}`, source: `domain-${domain.id}`, target: `skill-${skill.id}`, style: { stroke: "#1f2937", strokeWidth: 1 } });
    });
  });
  return edges;
}
