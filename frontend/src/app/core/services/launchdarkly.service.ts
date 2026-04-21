import {Injectable} from '@angular/core';
import {createClient, LDClient} from '@launchdarkly/js-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
import {environment} from '../../../environments/environment';

const LD_CONTEXT_KEY = 'ld-anonymous-key';

@Injectable({providedIn: 'root'})
export class LaunchDarklyService {
  private client: LDClient | null = null;
  private initPromise: Promise<void> | null = null;

  initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    let contextKey = localStorage.getItem(LD_CONTEXT_KEY);
    if (!contextKey) {
      contextKey = crypto.randomUUID();
      localStorage.setItem(LD_CONTEXT_KEY, contextKey);
    }

    const context = {kind: 'user' as const, key: contextKey};
    this.client = createClient(environment.launchdarklyClientSideId, context, {
      plugins: [
        new Observability({
          networkRecording: {
            enabled: true,
            recordHeadersAndBody: true,
          },
        }),
        new SessionReplay({
          privacySetting: 'none',
        }),
      ],
    });
    this.client.start();

    this.initPromise = this.client.waitForInitialization({timeout: 5}).then(result => {
      if (result.status === 'failed') {
        console.error('LaunchDarkly initialization failed:', result.error);
      }
    });

    return this.initPromise;
  }

  variation<T>(flagKey: string, defaultValue: T): T {
    return (this.client?.variation(flagKey, defaultValue) ?? defaultValue) as T;
  }
}
