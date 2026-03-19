import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';

const GraphView = (props: any) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomBehavior = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
    const navigate = useNavigate();
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const graphData = await api.getTopicGraph();
                setData(graphData);
            } catch (error) {
                console.error("Failed to fetch graph:", error);
                // Fallback / Mock
                setData({ nodes: [], links: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchGraph();
    }, [props.topics]);

    useEffect(() => {
        if (loading || !svgRef.current) return;
        // Even if no nodes, we render empty SVG to avoid crash
        // But if nodes exist:

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 1. Zoom Container
        const g = svg.append("g");

        // 2. Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        // Store for buttons
        zoomBehavior.current = zoom;
        svg.call(zoom as any);

        if (!data.nodes.length) return;

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(60));

        // Links
        const link = g.append("g")
            .attr("stroke", "#E5E5E5")
            .attr("stroke-opacity", 1)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", 2);

        // Link Labels
        const linkLabel = g.append("g")
            .attr("class", "link-labels")
            .selectAll("text")
            .data(data.links)
            .join("text")
            .text((d: any) => d.label || "Related")
            .attr("font-size", "10px")
            .attr("fill", "#666666")
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .attr("dy", -5)
            .style("pointer-events", "auto") // Enable pointer events for hover
            .style("cursor", "help")
            .each(function (d: any) {
                if (d.rationale) d3.select(this).append("title").text(d.rationale);
            })
            .call((text: any) => text.clone(true)
                .attr("fill", "none")
                .attr("stroke", "#F9F9F8")
                .attr("stroke-width", 3)
                .lower());

        // Nodes
        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .attr("cursor", "pointer")
            .call(drag(simulation) as any)
            .on("click", (event: any, d: any) => {
                if (props.onNodeClick) props.onNodeClick(d.id);
            });

        node.append("circle")
            .attr("r", (d: any) => 20 + (d.depth * 5))
            .attr("fill", "#FF6B00")
            .attr("fill-opacity", 0.9)
            .attr("stroke", "#FFF0E6")
            .attr("stroke-width", 2);

        node.append("text")
            .text((d: any) => d.name)
            .attr("x", 25)
            .attr("y", 5)
            .attr("stroke", "none")
            .attr("fill", "#1A1A1A")
            .attr("font-size", "13px")
            .attr("font-weight", "600")
            .attr("font-family", "var(--font-main)")
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            linkLabel
                .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
                .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

            node
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

    }, [data, loading]);

    function drag(simulation: any) {
        return d3.drag()
            .on("start", (event: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", (event: any) => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", (event: any) => {
                if (!event.active) simulation.alphaTarget(0);
                // User requested sticky nodes: Do NOT unset fx/fy
                // event.subject.fx = null;
                // event.subject.fy = null;
            });
    }

    const handleZoomIn = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 1.3);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 0.7);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            {loading && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.5)', zIndex: 10
                }}>
                    Loading...
                </div>
            )}

            <svg
                ref={svgRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <button
                    onClick={handleZoomIn}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid var(--color-border)',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        color: 'var(--color-text)'
                    }}
                    title="Zoom In"
                >
                    <Plus size={20} />
                </button>
                <button
                    onClick={handleZoomOut}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid var(--color-border)',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        color: 'var(--color-text)'
                    }}
                    title="Zoom Out"
                >
                    <Minus size={20} />
                </button>
            </div>
        </div>
    );
};

export default GraphView;
