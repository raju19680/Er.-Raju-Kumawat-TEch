const fs = require('fs');
const file = 'src/components/teacher/course-management-page.tsx';
let content = fs.readFileSync(file, 'utf8');

const seoSection =                     <Card className="bsortOrder shadow-sm mt-6">
                    <CardContent className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-amber-500" />
                          SEO Settings
                        </h3>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="autoSeo" className="text-sm font-medium cursor-pointer">Auto Generate SEO</Label>
                          <Switch
                            id="autoSeo"
                            checked={form.autoGenerateSeo}
                            onCheckedChange={(v) => updateForm({ autoGenerateSeo: v })}
                          />
                        </div>
                      </div>

                      {!form.autoGenerateSeo && (
                        <div className="grid gap-4 mt-4 border-t pt-4">
                          <div className="grid gap-2">
                            <Label htmlFor="seoTitle" className="text-sm font-medium">SEO Title</Label>
                            <Input
                              id="seoTitle"
                              value={form.seoTitle}
                              onChange={(e) => updateForm({ seoTitle: e.target.value })}
                              placeholder="SEO Title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="seoDescription" className="text-sm font-medium">SEO Description</Label>
                            <Textarea
                              id="seoDescription"
                              value={form.seoDescription}
                              onChange={(e) => updateForm({ seoDescription: e.target.value })}
                              placeholder="SEO Description"
                              className="h-24"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
;

content = content.replace(
  '                  <Card className="bsortOrder shadow-sm">',
  seoSection + '\n                  <Card className="bsortOrder shadow-sm">'
);

fs.writeFileSync(file, content);
console.log('Added SEO UI');
