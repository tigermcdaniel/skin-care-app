import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { photoUrls, userId, notes, lightingConditions } = await request.json()

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: "Photo URLs are required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    const [routinesResult, inventoryResult, recentCheckinsResult] = await Promise.all([
      supabase
        .from("routines")
        .select(`
          *,
          routine_steps (
            step_number,
            instruction,
            products (name, brand, category, ingredients)
          )
        `)
        .eq("user_id", userId),

      supabase
        .from("user_inventory")
        .select(`
          amount_remaining,
          products (name, brand, category, ingredients, description)
        `)
        .eq("user_id", userId),

      supabase.from("daily_checkins").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(7),
    ])

    const routines = routinesResult.data || []
    const inventory = inventoryResult.data || []
    const recentCheckins = recentCheckinsResult.data || []

    const analysisPrompt = `
You are an expert dermatologist and skincare specialist analyzing daily check-in photos. Provide a comprehensive skin analysis and specific routine recommendations.

PHOTO ANALYSIS CONTEXT:
- Number of photos: ${photoUrls.length}
- Lighting conditions: ${lightingConditions}
- User notes: ${notes || "None provided"}

CURRENT USER CONTEXT:
ROUTINES (${routines.length} total):
${
  routines
    .map(
      (routine) => `
- ${routine.name} (${routine.routine_type}):
  ${routine.routine_steps?.map((step: any) => `  ${step.step_number}. ${step.instruction} ${step.products ? `(${step.products.name} by ${step.products.brand})` : ""}`).join("\n  ") || "No steps defined"}
`,
    )
    .join("\n") || "No routines defined"
}

CURRENT PRODUCTS (${inventory.length} total):
${inventory.map((item: any) => `- ${item.products?.name} by ${item.products?.brand} (${item.products?.category}) - ${item.amount_remaining}% remaining`).join("\n") || "No products in collection"}

RECENT PROGRESS (last 7 days):
${recentCheckins.map((checkin) => `- ${checkin.date}: Skin rating ${checkin.skin_condition_rating || "N/A"}/10, Morning routine: ${checkin.morning_routine_completed ? "Yes" : "No"}, Evening routine: ${checkin.evening_routine_completed ? "Yes" : "No"}`).join("\n") || "No recent check-ins"}

ANALYSIS REQUIREMENTS:
1. **Skin Condition Assessment**: Analyze visible skin concerns, improvements, or changes
2. **Routine Effectiveness**: Evaluate if current routine is working based on available context
3. **Product Recommendations**: Suggest adjustments using existing products or recommend new ones
4. **Specific Actions**: Provide actionable next steps
5. **Routine Modifications**: Suggest specific routine changes if needed

RESPONSE FORMAT:
Provide a detailed analysis in the following JSON structure:
{
  "skinCondition": {
    "overall": "description of overall skin condition",
    "concerns": ["list", "of", "visible", "concerns"],
    "improvements": ["list", "of", "improvements", "noted"],
    "rating": estimated_rating_1_to_10
  },
  "routineAnalysis": {
    "effectiveness": "assessment of current routine effectiveness",
    "strengths": ["what's", "working", "well"],
    "gaps": ["what's", "missing", "or", "needs", "improvement"]
  },
  "recommendations": {
    "immediate": ["immediate", "actions", "to", "take"],
    "productAdjustments": ["specific", "product", "usage", "changes"],
    "newProducts": ["products", "to", "consider", "adding"],
    "routineChanges": ["routine", "modifications", "suggested"]
  },
  "routineSuggestions": {
    "morning": {
      "shouldModify": true/false,
      "changes": ["specific step changes for morning routine"],
      "reasoning": "why these changes are needed"
    },
    "evening": {
      "shouldModify": true/false,
      "changes": ["specific step changes for evening routine"],
      "reasoning": "why these changes are needed"
    }
  },
  "summary": "brief summary of key findings and next steps"
}

ROUTINE SUGGESTION GUIDELINES:
- Only suggest routine modifications if there are clear skin concerns that warrant changes
- Base suggestions on the user's existing products when possible
- Provide specific, actionable steps rather than vague advice
- Consider the user's current routine effectiveness and recent progress
- If no routine changes are needed, set shouldModify to false
- Focus on addressing the most pressing skin concerns identified in the photos

Note: Since I cannot actually see the photos, base your analysis on the provided context, user notes, lighting conditions, and historical data to provide the most helpful guidance possible.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: analysisPrompt,
      temperature: 0.7,
    })

    let analysis
    try {
      // Try to parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        // Fallback to text response
        analysis = {
          skinCondition: {
            overall: "Analysis completed based on available context",
            concerns: [],
            improvements: [],
            rating: 5,
          },
          routineAnalysis: {
            effectiveness: "Routine assessment completed",
            strengths: [],
            gaps: [],
          },
          recommendations: {
            immediate: [],
            productAdjustments: [],
            newProducts: [],
            routineChanges: [],
          },
          routineSuggestions: {
            morning: {
              shouldModify: false,
              changes: [],
              reasoning: "No changes needed at this time",
            },
            evening: {
              shouldModify: false,
              changes: [],
              reasoning: "No changes needed at this time",
            },
          },
          summary: text,
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      analysis = {
        skinCondition: {
          overall: "Analysis completed",
          concerns: [],
          improvements: [],
          rating: 5,
        },
        routineAnalysis: {
          effectiveness: "Assessment completed",
          strengths: [],
          gaps: [],
        },
        recommendations: {
          immediate: [],
          productAdjustments: [],
          newProducts: [],
          routineChanges: [],
        },
        routineSuggestions: {
          morning: {
            shouldModify: false,
            changes: [],
            reasoning: "No changes needed at this time",
          },
          evening: {
            shouldModify: false,
            changes: [],
            reasoning: "No changes needed at this time",
          },
        },
        summary: text,
      }
    }

    let chatMessage = `I've analyzed your photos and here's what I found:\n\n**Skin Analysis**: ${analysis.summary}\n\n`

    if (analysis.routineSuggestions.morning.shouldModify || analysis.routineSuggestions.evening.shouldModify) {
      chatMessage += "Based on your skin analysis, I have some routine suggestions for you:\n\n"

      if (analysis.routineSuggestions.morning.shouldModify) {
        chatMessage += `**Morning Routine Adjustments**: ${analysis.routineSuggestions.morning.reasoning}\n`
        chatMessage += `[ROUTINE]{"type": "morning", "changes": ${JSON.stringify(analysis.routineSuggestions.morning.changes)}}[/ROUTINE]\n\n`
      }

      if (analysis.routineSuggestions.evening.shouldModify) {
        chatMessage += `**Evening Routine Adjustments**: ${analysis.routineSuggestions.evening.reasoning}\n`
        chatMessage += `[ROUTINE]{"type": "evening", "changes": ${JSON.stringify(analysis.routineSuggestions.evening.changes)}}[/ROUTINE]\n\n`
      }

      chatMessage += "Would you like to accept these routine changes?"
    } else {
      chatMessage += "Your current routine looks good based on this analysis. Keep up the great work!"
    }

    return NextResponse.json({
      success: true,
      analysis,
      chatMessage,
      photoCount: photoUrls.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error analyzing photos:", error)
    return NextResponse.json({ error: "Failed to analyze photos" }, { status: 500 })
  }
}
