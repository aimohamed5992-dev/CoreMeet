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

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(authControllerProvider.notifier).register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
          );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorText(context.l10n, e, fallbackKey: 'errorCreateFailed'))),
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
      title: l10n.registerTitle,
      subtitle: l10n.registerSubtitle,
      footer: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(l10n.registerHaveAccount, style: TextStyle(color: context.colors.textMuted)),
          TextButton(
            onPressed: () => context.go(Routes.login),
            child: Text(l10n.registerSignIn),
          ),
        ],
      ),
      children: [
        Form(
          key: _form,
          child: Column(
            children: [
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                autofillHints: const [AutofillHints.name],
                textInputAction: TextInputAction.next,
                validator: v.name,
                decoration: InputDecoration(labelText: l10n.commonName),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.newUsername, AutofillHints.email],
                textInputAction: TextInputAction.next,
                validator: v.email,
                decoration: InputDecoration(labelText: l10n.commonEmail),
              ),
              const SizedBox(height: 14),
              PasswordField(
                controller: _password,
                hint: l10n.passwordHint,
                textInputAction: TextInputAction.done,
                validator: (value) => v.password(value, requireLength: true),
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 22),
              BusyButton(
                label: l10n.registerCta,
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
