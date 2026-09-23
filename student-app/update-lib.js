const fs = require('fs');
const file = 'src/components/student-portal/student-library.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add states
code = code.replace("const [documents, setDocuments] = useState<StudyDocument[]>([])", 
`const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])`);

// Update activeTab type
code = code.replace("useState<'notes' | 'purchases'>('notes')", "useState<'notes' | 'purchases' | 'bookmarks'>('notes')");

// Update loadData
code = code.replace("const [prodRes, docRes] = await Promise.allSettled([", 
`const [prodRes, docRes, libRes] = await Promise.allSettled([`);

code = code.replace("'/api/student/library/documents'\n          ),", 
`'/api/student/library/documents'\n          ),
          apiFetchJSON<{ success: boolean; data: any }>('/api/student/library')`);

code = code.replace("setDocuments(docRes.value.documents || [])\n        }", 
`setDocuments(docRes.value.documents || [])
        }
        if (libRes.status === 'fulfilled' && libRes.value.success) {
          setCollections(libRes.value.data.collections || [])
          setBookmarks(libRes.value.data.bookmarks || [])
          setTags(libRes.value.data.tags || [])
        }`);

// Add Tab Button
const tabsReplacement = `Purchased E-Books ({products.length})
          </Button>
          <Button
            variant={activeTab === 'bookmarks' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 font-medium"
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark className="size-4" />
            Bookmarks & Collections ({bookmarks.length})
          </Button>
        </div>`;
code = code.replace("Purchased E-Books ({products.length})\n          </Button>\n        </div>", tabsReplacement);

// Add content render for bookmarks tab
const renderReplacement = `      ) : activeTab === 'bookmarks' ? (
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <h2 className="text-lg font-semibold">My Collections</h2>
            <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Collection</Button>
          </div>
          {collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No collections yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold"><Folder className="w-5 h-5 text-emerald-500" /> {c.name}</div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">{c._count?.bookmarks || 0} items</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Saved Bookmarks</h2>
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No bookmarks yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map(b => (
                  <div key={b.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-card hover:border-emerald-200 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm text-emerald-700">{b.title}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{b.resourceType}</Badge>
                    </div>
                    {b.collection && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="w-3 h-3" /> {b.collection.name}</div>
                    )}
                    {b.tags && b.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {b.tags.map((t: any) => (
                          <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">{t.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'notes' ? (`;

code = code.replace(") : activeTab === 'notes' ? (", renderReplacement);

// Add missing imports
if (!code.includes("import { Folder, Plus }")) {
  code = code.replace("import { BookOpen,", "import { BookOpen, Folder, Plus,");
}

fs.writeFileSync(file, code);
console.log("Updated student-library.tsx");
