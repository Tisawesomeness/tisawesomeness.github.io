# Prevents Jektex from pre-rendering math in Mermaid diagram blocks,
# as Mermaid uses its own math renderer for diagrams

require "digest"

module Jekyll
  class ProtectMermaidMath
    PROTECTION_TOKEN = "JEKTeX_MERMAID_PROTECTED_"
    MERMAID_PATTERN = /<pre\s+class="mermaid"[^>]*>.*?<\/pre>/mi
    MATH_PATTERN = /(?<!\\)\$\$(?<math>.+?)(?<!\\)\$\$/m

    def self.protect_mermaid_math(content)
      return content unless content.is_a?(String)
      return content unless content.include?('<pre class="mermaid"')

      content.gsub(MERMAID_PATTERN) do |block|
        block.gsub(MATH_PATTERN) do |math_match|
          math_body = Regexp.last_match[:math]
          token = PROTECTION_TOKEN + Digest::SHA256.hexdigest(math_body)[0, 16]
          @protected_math ||= {}
          @protected_math[token] = math_body
          token
        end
      end
    end

    def self.restore_mermaid_math(content)
      return content unless content.is_a?(String)
      return content unless content.include?(PROTECTION_TOKEN)

      @protected_math ||= {}
      content.gsub(/#{Regexp.escape(PROTECTION_TOKEN)}[a-f0-9]{16}/) do |token|
        math_body = @protected_math[token]
        math_body ? "$$\\\\:#{math_body}\\\\:$$" : token
      end
    end
  end

  Jekyll::Hooks.register [:pages, :documents], :pre_render do |page|
    page.content = ProtectMermaidMath.protect_mermaid_math(page.content)
  end

  Jekyll::Hooks.register [:pages, :documents], :post_render do |page|
    page.output = ProtectMermaidMath.restore_mermaid_math(page.output)
  end
end