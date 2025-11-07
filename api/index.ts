import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    console.log(`[API] ${method} ${url}`);
    
    // Health check
    if (url?.includes('/health')) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'HarmonyForge API is running',
        timestamp: new Date().toISOString(),
        environment: 'vercel-serverless',
        method,
        url
      });
    }

    // Harmonize endpoint
    if (url?.includes('/harmonize')) {
      try {
        console.log('[API] Harmonize request received - returning mock data');
        
        // Mock response for testing the full flow
        const mockHarmonyXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Harmonized Music (Mock)</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Harmony</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

        const mockCombinedXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Combined Score (Mock)</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Melody</part-name>
    </score-part>
    <score-part id="P2">
      <part-name>Harmony</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        return res.status(200).json({
          harmonyOnly: {
            content: mockHarmonyXML,
            filename: 'mock_harmony.musicxml'
          },
          combined: {
            content: mockCombinedXML,
            filename: 'mock_combined.musicxml'
          },
          metadata: {
            instruments: ['Violin', 'Cello'],
            processingTime: 500,
            note: 'This is mock data for testing the frontend flow'
          }
        });

      } catch (harmonizeError) {
        console.error('[API] Harmonize error:', harmonizeError);
        return res.status(500).json({
          error: 'Harmonize endpoint error',
          message: harmonizeError instanceof Error ? harmonizeError.message : 'Unknown error',
          stack: harmonizeError instanceof Error ? harmonizeError.stack : undefined
        });
      }
    }

    // Default 404
    console.log('[API] Route not found:', url);
    return res.status(404).json({ 
      error: 'Not found',
      path: url 
    });

  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
