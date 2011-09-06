class Person < Sequel::Model
  one_to_many :milestones, :order => [:date_from, :date_to]
  many_to_many :documents
  def mentions_in(doc)
    DocumentsPerson.select(:mentions).first(:document_id => doc.id, :person_id => self.id).mentions
  end
  def self.normalize_name(name)
    ActiveSupport::Inflector.transliterate(name.to_s.downcase)
  end
  def self.filter_by_name(name)
    self.filter(:searchable_name => normalize_name(name))
  end
  def before_save
    self.searchable_name = self.class.normalize_name(name)
  end

  def self.autocomplete_json(letters)
    output = self.filter(:searchable_name.like("#{letters}%")).all.map do |person|
      {:id => person.id, :name => person.searchable_name }
    end
    output.to_json
  end
end
Person.plugin :json_serializer
