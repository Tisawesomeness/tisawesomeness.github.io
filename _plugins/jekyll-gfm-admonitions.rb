# jekyll-gfm-admonitions
# Copyright (c) 2024 Robin De Schepper
# Licensed under the MIT license.

# Modified to remove CSS injection

# frozen_string_literal: true

require 'octicons'
require 'liquid/template'

ADMONITION_ICONS = {
  'important' => 'report',
  'note' => 'info',
  'tip' => 'light-bulb',
  'warning' => 'alert',
  'caution' => 'stop'
}.freeze

# JekyllGFMAdmonitions is a module that provides functionality to process and
# convert GitHub-flavored markdown admonitions into HTML within Jekyll.
module JekyllGFMAdmonitions
  # GFMAdmonitionConverter is a Jekyll generator that converts custom
  # admonition blocks in markdown (e.g., `> [!IMPORTANT]`) into styled HTML
  # alert boxes with icons.
  #
  # This generator processes both posts and pages, replacing admonition
  # syntax with HTML markup that includes appropriate iconography and CSS styling.
  class GFMAdmonitionConverter < Jekyll::Generator
    safe true
    priority :lowest

    class << self
      attr_reader :admonition_pages

      def reset!
        @admonition_pages = []
      end
    end

    reset!

    def generate(site)
      self.class.reset!

      init_converter(site)
      process_collections(site)
      process_pages(site)
      Jekyll.logger.info 'GFMA:', "Converted admonitions in #{self.class.admonition_pages.length} file(s)."
    end

    def init_converter(site)
      @markdown = site.converters.find { |c| c.is_a?(Jekyll::Converters::Markdown) }
      return if @markdown

      raise 'Markdown converter not found. Please ensure that you have a markdown' \
              ' converter configured in your Jekyll site.'
    end

    def process_collections(site)
      site.collections.each do |name, collection|
        collection.docs.each do |doc|
          Jekyll.logger.debug 'GFMA:', "Processing collection '#{name}' document '#{doc.path}' (#{doc.content.length} characters)."
          process_doc_content(doc)
        end
      end
    end

    def process_pages(site)
      site.pages.each do |page|
        Jekyll.logger.debug 'GFMA:', "Processing page '#{page.path}' (#{page.content.length} characters)."
        process_doc_content(page)
      end
    end

    def process_doc_content(doc)
      original_content = doc.content.dup
      process_doc(doc)

      return unless doc.content != original_content
    end

    def process_doc(doc)
      # Return early if content is empty
      return if doc.content.empty?

      # If the content is frozen, we need to duplicate it so that we can modify it
      doc.content = doc.content.dup if doc.content.frozen?

      code_blocks = []
      # Temporarily replace fenced code blocks by a tag, so that we don't process any
      # admonitions inside of code blocks.
      doc.content.gsub!(/(?:^|\n)(?<!>)\s*```.*?```/m) do |match|
        code_blocks << match
        "```{{CODE_BLOCK_#{code_blocks.length - 1}}}```"
      end

      indented_blocks = []
      # Temporarily replace 4-space/tab indented code blocks (CommonMark §4.4).
      # These must be preceded by a blank line or appear at start of content —
      # indented code blocks cannot interrupt a paragraph.
      doc.content.gsub!(/(\A|\n\n)((?:(?:[ ]{4,}|\t)[^\n]*(?:\n|\z))+)/) do
        anchor = ::Regexp.last_match(1)
        block  = ::Regexp.last_match(2)
        indented_blocks << block
        "#{anchor}{{INDENTED_CODE_BLOCK_#{indented_blocks.length - 1}}}"
      end

      convert_admonitions(doc)

      # Restore indented code blocks, then fenced code blocks.
      doc.content.gsub!(/\{\{INDENTED_CODE_BLOCK_(\d+)\}\}/) do
        indented_blocks[::Regexp.last_match(1).to_i]
      end
      doc.content.gsub!(/```\{\{CODE_BLOCK_(\d+)}}```/) do
        code_blocks[::Regexp.last_match(1).to_i]
      end
    end

    def convert_admonitions(doc)
      doc.content.gsub!(/^([^\S\n]*)>[^\S\n]*\[!(IMPORTANT|NOTE|WARNING|TIP|CAUTION)\]([^\n]*)\n((?:\1[^\S\n]*>[^\S\n]*[^\n]*(?:\n|$))(?:(?![^\S\n]*>[^\S\n]*\[!)\1[^\S\n]*>[^\S\n]*[^\n]*(?:\n|$))*)/i) do
        initial_indent = ::Regexp.last_match(1)
        type = ::Regexp.last_match(2).downcase
        title = ::Regexp.last_match(3).strip.empty? ? type.capitalize : ::Regexp.last_match(3).strip
        # Strip the blockquote prefix from each line. Per CommonMark, a `>`
        # marker consumes at most ONE following space, so we only remove a
        # single space here. Consuming all whitespace would flatten the
        # indentation that distinguishes nested list items (see issue #20).
        text = ::Regexp.last_match(4).gsub(/^#{Regexp.escape(initial_indent)}[^\S\n]*>[^\S\n]?/, '').strip

        icon = Octicons::Octicon.new(ADMONITION_ICONS[type]).to_svg
        html = admonition_html(type, title, text, icon)
        initial_indent.empty? ? html : html.gsub(/^/, initial_indent)
      end

      # Ensure a blank line exists after each admonition block to prevent Markdown parsing issues.
      doc.content.gsub!(/(<\/div>)(?!\n\n)/, "\\1\n\n")
    end

    def admonition_html(type, title, text, icon)
      body = @markdown.convert(text)
      body = body.gsub(/href="(?!https?:\/\/)([^"]*?)\.md(#[^"]*?)?"/) do
        anchor = ::Regexp.last_match(2) || ''
        "href=\"#{::Regexp.last_match(1)}.html#{anchor}\""
      end
      "<div class='markdown-alert markdown-alert-#{type}'>" \
        "<p class='markdown-alert-title'>#{icon} #{title}</p>" \
        "#{body}" \
      "</div>"
    end
  end
end