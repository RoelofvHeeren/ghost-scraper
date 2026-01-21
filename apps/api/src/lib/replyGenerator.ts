import { Lead, ReplyTemplate } from "@prisma/client";

export function generateReplyStub(lead: Lead, templates: ReplyTemplate[]): string {
    // 1. Filter templates by services/tags (mock logic)
    // const suitable = templates.filter(t => t.tags.includes(lead.serviceType));

    const suitable = templates;

    if (suitable.length === 0) {
        return "Hi there, we can help with that! Please call us at " + (lead.phoneTrackingNumber || "555-0199");
    }

    // 2. Pick random
    const template = suitable[Math.floor(Math.random() * suitable.length)];

    // 3. Substitute strings
    let text = template.templateText;
    text = text.replace("{{phone}}", lead.phoneTrackingNumber || "555-0199");
    // text = text.replace("{{name}}", lead.candidate.author || "Neighbor");

    return text;
}
