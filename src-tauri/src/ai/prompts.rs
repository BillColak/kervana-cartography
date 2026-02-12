pub fn expand_node_system() -> String {
    r#"You are a market research analyst. Given a market niche and its ancestor path, suggest 3-5 sub-niches for deeper exploration.

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "label": "string - short name for the sub-niche",
      "description": "string - one sentence description",
      "pain_points": ["string - key pain point 1", "string - key pain point 2"],
      "audiences": ["string - target audience 1", "string - target audience 2"],
      "competition_level": "low | medium | high",
      "keywords": ["string - SEO/search keyword 1", "string - keyword 2"]
    }
  ]
}

Guidelines:
- Each sub-niche should be specific and actionable
- Pain points should reflect real frustrations people have
- Audiences should be concrete demographics or psychographics
- Competition level should reflect how saturated the niche is
- Keywords should be terms people actually search for"#
        .to_string()
}

pub fn expand_node_user(node_label: &str, ancestors: &[String]) -> String {
    let path = if ancestors.is_empty() {
        node_label.to_string()
    } else {
        let mut full = ancestors.join(" > ");
        full.push_str(" > ");
        full.push_str(node_label);
        full
    };

    format!(
        "Market path: {}\n\nSuggest 3-5 sub-niches under \"{}\" that represent specific, profitable market segments worth exploring.",
        path, node_label
    )
}

pub fn pain_points_system() -> String {
    r#"You are a market research analyst specializing in customer pain points. Given a niche market, identify 3-5 key pain points that potential customers experience.

Return ONLY valid JSON matching this schema:
{
  "pain_points": [
    {
      "frustration": "string - what the customer is frustrated about",
      "user_quote": "string - a realistic quote from someone experiencing this pain",
      "why_solutions_fail": "string - why current solutions don't adequately address this",
      "severity": 1-10
    }
  ]
}

Guidelines:
- Pain points should be specific and validated by real market signals
- User quotes should sound authentic and emotional
- Severity 1-3 is mild inconvenience, 4-6 is moderate frustration, 7-10 is urgent problem
- Focus on pain points that represent business opportunities"#
        .to_string()
}

pub fn pain_points_user(node_label: &str, context: &str) -> String {
    format!(
        "Niche: {}\nContext: {}\n\nIdentify 3-5 key pain points that people in the \"{}\" market experience. Focus on frustrations that could be solved with a product or service.",
        node_label, context, node_label
    )
}

pub fn validate_niche_system() -> String {
    r#"You are a market validation expert. Given a niche market with its pain points and target audiences, score its viability.

Return ONLY valid JSON matching this schema:
{
  "validation": {
    "market_depth": 0.0-1.0,
    "competition_intensity": 0.0-1.0,
    "pain_severity": 0.0-1.0,
    "monetization_potential": 0.0-1.0,
    "final_score": 0-100,
    "summary": "string - 2-3 sentence assessment of market viability"
  }
}

Scoring guidelines:
- market_depth: How deep and specific is this niche? (higher = more specific and addressable)
- competition_intensity: How competitive is this space? (higher = more competition, harder to enter)
- pain_severity: How painful is the problem? (higher = more urgent need)
- monetization_potential: Can you realistically charge for a solution? (higher = easier to monetize)
- final_score: Overall viability 0-100 considering all factors
- A good niche has high depth, low-medium competition, high pain, and high monetization potential"#
        .to_string()
}

pub fn validate_niche_user(
    node_label: &str,
    pain_points: &[String],
    audiences: &[String],
) -> String {
    let pains = if pain_points.is_empty() {
        "None identified yet".to_string()
    } else {
        pain_points.join(", ")
    };

    let auds = if audiences.is_empty() {
        "None identified yet".to_string()
    } else {
        audiences.join(", ")
    };

    format!(
        "Niche: {}\nKnown pain points: {}\nTarget audiences: {}\n\nScore the market viability of \"{}\" considering the available information.",
        node_label, pains, auds, node_label
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expand_system_contains_json_schema() {
        let prompt = expand_node_system();
        assert!(prompt.contains("suggestions"));
        assert!(prompt.contains("label"));
        assert!(prompt.contains("pain_points"));
        assert!(prompt.contains("competition_level"));
    }

    #[test]
    fn test_expand_user_with_ancestors() {
        let result = expand_node_user("Fitness", &["Health".to_string(), "Wellness".to_string()]);
        assert!(result.contains("Health > Wellness > Fitness"));
        assert!(result.contains("sub-niches under \"Fitness\""));
    }

    #[test]
    fn test_expand_user_no_ancestors() {
        let result = expand_node_user("Health", &[]);
        assert!(result.contains("Market path: Health"));
        assert!(result.contains("sub-niches under \"Health\""));
        assert!(!result.contains(" > "));
    }

    #[test]
    fn test_pain_points_system_contains_schema() {
        let prompt = pain_points_system();
        assert!(prompt.contains("frustration"));
        assert!(prompt.contains("user_quote"));
        assert!(prompt.contains("severity"));
    }

    #[test]
    fn test_pain_points_user_with_context() {
        let result = pain_points_user("Yoga", "Ancient practice for flexibility and mindfulness");
        assert!(result.contains("Niche: Yoga"));
        assert!(result.contains("Ancient practice"));
    }

    #[test]
    fn test_pain_points_user_empty_context() {
        let result = pain_points_user("Yoga", "");
        assert!(result.contains("Niche: Yoga"));
        assert!(result.contains("Context: "));
    }

    #[test]
    fn test_validate_system_contains_schema() {
        let prompt = validate_niche_system();
        assert!(prompt.contains("market_depth"));
        assert!(prompt.contains("competition_intensity"));
        assert!(prompt.contains("final_score"));
        assert!(prompt.contains("monetization_potential"));
    }

    #[test]
    fn test_validate_user_with_data() {
        let result = validate_niche_user(
            "Online Yoga",
            &["Limited class times".to_string(), "Expensive studios".to_string()],
            &["Women 25-45".to_string()],
        );
        assert!(result.contains("Niche: Online Yoga"));
        assert!(result.contains("Limited class times"));
        assert!(result.contains("Expensive studios"));
        assert!(result.contains("Women 25-45"));
    }

    #[test]
    fn test_validate_user_empty_data() {
        let result = validate_niche_user("Yoga", &[], &[]);
        assert!(result.contains("None identified yet"));
    }
}
