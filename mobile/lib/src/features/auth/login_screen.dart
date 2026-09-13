import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../localization/l10n_ext.dart';
import '../../network/error_text.dart';
import '../../router/app_router.dart';
import '../../theme/app_theme.dart';
import '../../widgets/busy_button.dart';
import 'validators.dart';
import 'widgets/auth_scaffold.dart';
import 'widgets/password_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(authControllerProvider.notifier).login(
            email: _email.text.trim(),
            password: _password.text,
          );
      // The router redirect takes it from here.
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorText(context.l10n, e, fallbackKey: 'errorSignInFailed'))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final v = Validators(l10n);

    return AuthScaffold(
      title: l10n.loginTitle,
      subtitle: l10n.loginSubtitle,
      footer: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(l10n.loginNoAccount, style: TextStyle(color: context.colors.textMuted)),
          TextButton(
            onPressed: () => context.go(Routes.register),
            child: Text(l10n.loginCreateAccount),
          ),
        ],
      ),
      children: [
        Form(
          key: _form,
          child: Column(
            children: [
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                validator: v.email,
                decoration: InputDecoration(labelText: l10n.commonEmail),
              ),
              const SizedBox(height: 14),
              PasswordField(
                controller: _password,
                textInputAction: TextInputAction.done,
                validator: (value) => v.password(value),
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 22),
              BusyButton(
                label: l10n.loginCta,
                busy: _submitting,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
